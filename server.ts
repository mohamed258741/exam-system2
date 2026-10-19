import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { storage } from './server/storage.js';
import { getPublicQuestions, QUESTIONS_DATA } from './server/questionsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory instructor sessions
const instructorTokens = new Set<string>();

// Realtime SSE clients
const sseClients = new Set<Response>();

function broadcastEvent(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Instructor auth middleware
function requireInstructor(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'غير مصرح به. يرجى تسجيل الدخول كمدرس.' });
    return;
  }
  const token = authHeader.substring(7).trim();
  if (!storage.isValidInstructorToken(token)) {
    res.status(401).json({ error: 'جلسة المدرس غير صالحة أو منتهية. يرجى إعادة تسجيل الدخول.' });
    return;
  }
  next();
}

// ---------------- Realtime SSE ----------------
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`);

  const cleanup = () => {
    sseClients.delete(res);
  };

  req.on('close', cleanup);
  req.on('end', cleanup);
  res.on('finish', cleanup);
  res.on('error', cleanup);
});

// Periodic keep-alive ping for 50+ concurrent SSE clients to prevent reverse-proxy timeouts
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 12000);

// Health check endpoint for system monitoring
app.get('/api/health', (_req: Request, res: Response) => {
  const stats = storage.getDashboardStats();
  res.json({
    status: 'ok',
    activeSSE: sseClients.size,
    activeExams: stats.activeExams,
    pendingRequests: stats.pendingRequests,
    uptime: process.uptime()
  });
});

// ---------------- Public Student Endpoints ----------------

// Request access
app.post('/api/student/request-access', (req: Request, res: Response) => {
  const { studentName } = req.body;
  if (!studentName || typeof studentName !== 'string' || !studentName.trim()) {
    res.status(400).json({ error: 'يرجى إدخال الاسم الكامل للطالب بشكل صحيح' });
    return;
  }

  const trimmed = studentName.trim();
  if (trimmed.length < 3) {
    res.status(400).json({ error: 'الاسم المدخل قصير جداً، يرجى إدخال الاسم الكامل' });
    return;
  }

  const accessRequest = storage.createAccessRequest(trimmed);
  broadcastEvent('new_request', accessRequest);

  res.json({
    success: true,
    request: accessRequest
  });
});

// Check access request status
app.get('/api/student/request-status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const accessRequest = storage.getAccessRequest(id);
  if (!accessRequest) {
    res.status(404).json({ error: 'طلب الدخول غير موجود' });
    return;
  }

  // Check if student already has active or completed attempts
  const attempts = storage.getAttemptsForRequest(id);
  const activeAttempt = attempts.find(a => a.status === 'active');
  const completedAttempt = attempts.find(a => a.status === 'submitted' || a.status === 'expired');

  // If instructor authorized a new attempt, allow them through to instructions
  const hasCompletedAttempt = !!completedAttempt && !accessRequest.allow_new_attempt;

  res.json({
    success: true,
    request: accessRequest,
    activeAttempt: activeAttempt || null,
    hasCompletedAttempt,
    completedAttemptId: completedAttempt ? completedAttempt.id : null,
    allowNewAttempt: !!accessRequest.allow_new_attempt
  });
});

// Start authorized exam attempt
app.post('/api/student/start-exam', (req: Request, res: Response) => {
  const { requestId } = req.body;
  if (!requestId) {
    res.status(400).json({ error: 'معرف طلب الدخول مطلوب' });
    return;
  }

  const result = storage.startExamAttempt(requestId);
  if ('error' in result) {
    res.status(403).json({ error: result.error });
    return;
  }

  broadcastEvent('exam_started', {
    attemptId: result.attempt.id,
    studentName: result.attempt.student_name
  });

  res.json({
    success: true,
    attempt: result.attempt,
    isNew: result.isNew
  });
});

// Get questions for active exam (answers NOT included)
app.get('/api/student/exam/:attemptId', (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const attempt = storage.getAttempt(attemptId);
  if (!attempt) {
    res.status(404).json({ error: 'محاولة الامتحان غير موجودة' });
    return;
  }

  // Authoritative server deadline check
  const now = Date.now();
  const deadline = new Date(attempt.deadline_at).getTime();
  const remainingSeconds = Math.max(0, Math.round((deadline - now) / 1000));

  const savedAnswers = storage.getStudentAnswers(attemptId);
  const questions = getPublicQuestions();

  res.json({
    attempt: {
      id: attempt.id,
      student_name: attempt.student_name,
      status: attempt.status,
      started_at: attempt.started_at,
      deadline_at: attempt.deadline_at,
      remaining_seconds: remainingSeconds,
      is_locked: attempt.status !== 'active'
    },
    questions,
    savedAnswers
  });
});

// Save answer
app.post('/api/student/exam/:attemptId/answer', (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { questionId, selectedOption } = req.body;

  if (!questionId || !selectedOption) {
    res.status(400).json({ error: 'بيانات الإجابة غير مكتملة' });
    return;
  }

  if (!['أ', 'ب', 'ج', 'د'].includes(selectedOption)) {
    res.status(400).json({ error: 'خيار الإجابة غير صالح' });
    return;
  }

  const result = storage.saveStudentAnswer(attemptId, Number(questionId), selectedOption);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }

  res.json({ success: true });
});

// Submit exam manually
app.post('/api/student/exam/:attemptId/submit', (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const finalized = storage.finalizeAttempt(attemptId, 'submitted');
  if (!finalized) {
    res.status(404).json({ error: 'المحاولة غير موجودة' });
    return;
  }

  broadcastEvent('exam_completed', {
    attemptId: finalized.id,
    studentName: finalized.student_name,
    score: finalized.score,
    status: finalized.status
  });

  res.json({
    success: true,
    attempt: finalized
  });
});

// Get finalized exam results & question-by-question review (ONLY after completion)
app.get('/api/student/exam/:attemptId/results', (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const result = storage.getAttemptDetailedResult(attemptId);
  if (!result) {
    res.status(404).json({ error: 'نتيجة المحاولة غير متوفرة' });
    return;
  }
  if ('error' in result) {
    res.status(403).json({ error: result.error });
    return;
  }

  res.json({
    success: true,
    ...result
  });
});

// ---------------- Instructor Endpoints ----------------

// Instructor Login (case-sensitive check against Farida123 or stored password)
app.post('/api/instructor/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'يرجى إدخال كلمة مرور المدرس' });
    return;
  }

  const currentPassword = storage.getInstructorPassword();
  // Exact case-sensitive match
  if (password !== currentPassword) {
    res.status(401).json({ error: 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.' });
    return;
  }

  // Issue random secure token
  const token = 'inst_' + crypto.randomBytes(32).toString('hex');
  storage.addInstructorToken(token);
  storage.addAuditLog('instructor_login', 'تسجيل دخول ناجح للمدرس إلى لوحة التحكم');

  res.json({
    success: true,
    token,
    message: 'تم تسجيل الدخول بنجاح'
  });
});

// Verify instructor token (called on page load/refresh)
app.get('/api/instructor/verify', requireInstructor, (_req: Request, res: Response) => {
  res.json({ success: true, verified: true });
});

// Instructor Logout
app.post('/api/instructor/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    storage.removeInstructorToken(token);
  }
  res.json({ success: true });
});

// Instructor change password
app.post('/api/instructor/change-password', requireInstructor, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'يرجى تقديم كلمة المرور الحالية وكلمة المرور الجديدة' });
    return;
  }

  if (currentPassword !== storage.getInstructorPassword()) {
    res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف' });
    return;
  }

  storage.updateInstructorPassword(newPassword);
  res.json({ success: true, message: 'تم تغيير كلمة مرور المدرس بنجاح' });
});

// Instructor Stats
app.get('/api/instructor/stats', requireInstructor, (_req: Request, res: Response) => {
  const stats = storage.getDashboardStats();
  res.json({ success: true, stats });
});

// All access requests
app.get('/api/instructor/requests', requireInstructor, (_req: Request, res: Response) => {
  const requests = storage.getAllAccessRequests();
  res.json({ success: true, requests });
});

// Action on access request (approve / reject)
app.post('/api/instructor/requests/:id/action', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!['approved', 'rejected', 'revoked'].includes(status)) {
    res.status(400).json({ error: 'الإجراء المطلوب غير صالح' });
    return;
  }

  const updated = storage.updateAccessRequestStatus(id, status, note);
  if (!updated) {
    res.status(404).json({ error: 'طلب الدخول غير موجود' });
    return;
  }

  broadcastEvent('request_updated', updated);

  res.json({ success: true, request: updated });
});

// Delete access request (and its attempts)
app.delete('/api/instructor/requests/:id', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = storage.deleteAccessRequest(id);
  if (!success) {
    res.status(404).json({ error: 'طلب الدخول غير موجود' });
    return;
  }
  broadcastEvent('request_deleted', { requestId: id });
  res.json({ success: true, message: 'تم حذف طلب الدخول ومحاولات الطالب بنجاح' });
});

app.post('/api/instructor/requests/:id/delete', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = storage.deleteAccessRequest(id);
  if (!success) {
    res.status(404).json({ error: 'طلب الدخول غير موجود' });
    return;
  }
  broadcastEvent('request_deleted', { requestId: id });
  res.json({ success: true, message: 'تم حذف طلب الدخول ومحاولات الطالب بنجاح' });
});

// Live exam monitoring
app.get('/api/instructor/monitoring', requireInstructor, (_req: Request, res: Response) => {
  storage.checkAndExpireAttempts();
  const requests = storage.getAllAccessRequests().filter(r => r.status === 'approved');
  const attempts = storage.getAllAttempts();

  const now = Date.now();
  const monitoringData = requests.map(req => {
    const studentAttempts = attempts.filter(a => a.access_request_id === req.id);
    const activeAttempt = studentAttempts.find(a => a.status === 'active');
    const latestAttempt = studentAttempts[0] || null;

    let examStatusLabel = 'لم يبدأ الامتحان';
    let remainingSeconds = 0;
    let answeredCount = 0;
    let unansweredCount = 50;
    let score: number | null = null;
    let percentage: number | null = null;
    let startedAt: string | null = null;
    let submittedAt: string | null = null;
    let attemptId: string | null = null;

    if (activeAttempt) {
      attemptId = activeAttempt.id;
      examStatusLabel = 'جارٍ أداء الامتحان';
      startedAt = activeAttempt.started_at;
      const deadline = new Date(activeAttempt.deadline_at).getTime();
      remainingSeconds = Math.max(0, Math.round((deadline - now) / 1000));
      const answers = storage.getStudentAnswers(activeAttempt.id);
      answeredCount = Object.keys(answers).length;
      unansweredCount = Math.max(0, 50 - answeredCount);
    } else if (latestAttempt) {
      attemptId = latestAttempt.id;
      startedAt = latestAttempt.started_at;
      submittedAt = latestAttempt.submitted_at || null;
      score = latestAttempt.score ?? null;
      percentage = latestAttempt.percentage ?? null;
      answeredCount = (latestAttempt.correct_count || 0) + (latestAttempt.incorrect_count || 0);
      unansweredCount = latestAttempt.unanswered_count ?? (50 - answeredCount);

      if (latestAttempt.status === 'submitted') {
        examStatusLabel = 'تم تسليم الامتحان';
      } else if (latestAttempt.status === 'expired') {
        examStatusLabel = 'انتهى الوقت';
      } else if (latestAttempt.status === 'reset') {
        examStatusLabel = 'تمت إعادة التعيين';
      }
    }

    return {
      requestId: req.id,
      requestNumber: req.request_number,
      studentName: req.student_name,
      approvedAt: req.reviewed_at || req.requested_at,
      attemptId,
      attemptNumber: latestAttempt?.attempt_number || 1,
      startedAt,
      submittedAt,
      remainingSeconds,
      answeredCount,
      unansweredCount,
      examStatusLabel,
      rawStatus: activeAttempt ? 'active' : latestAttempt ? latestAttempt.status : 'not_started',
      score,
      percentage
    };
  });

  res.json({ success: true, monitoring: monitoringData });
});

// All attempts with full review capability
app.get('/api/instructor/attempts', requireInstructor, (_req: Request, res: Response) => {
  const attempts = storage.getAllAttempts();
  res.json({ success: true, attempts });
});

// Reset attempt
app.post('/api/instructor/attempts/:id/reset', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const success = storage.resetAttempt(id, reason);
  if (!success) {
    res.status(404).json({ error: 'المحاولة غير موجودة' });
    return;
  }
  broadcastEvent('attempt_reset', { attemptId: id });
  res.json({ success: true, message: 'تمت إعادة تعيين محاولة الامتحان بنجاح' });
});

// Delete attempt
app.delete('/api/instructor/attempts/:id', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = storage.deleteAttempt(id);
  if (!success) {
    res.status(404).json({ error: 'المحاولة غير موجودة' });
    return;
  }
  broadcastEvent('attempt_deleted', { attemptId: id });
  res.json({ success: true, message: 'تم حذف المحاولة بنجاح' });
});

app.post('/api/instructor/attempts/:id/delete', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = storage.deleteAttempt(id);
  if (!success) {
    res.status(404).json({ error: 'المحاولة غير موجودة' });
    return;
  }
  broadcastEvent('attempt_deleted', { attemptId: id });
  res.json({ success: true, message: 'تم حذف المحاولة بنجاح' });
});

// Authorize additional attempt for student
app.post('/api/instructor/requests/:id/authorize-attempt', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const success = storage.authorizeAdditionalAttempt(id, reason);
  if (!success) {
    res.status(404).json({ error: 'طلب الدخول غير موجود' });
    return;
  }
  broadcastEvent('attempt_authorized', { requestId: id });
  res.json({ success: true, message: 'تم الترخيص بمحاولة امتحان جديدة للطالب' });
});

// Get individual student detailed answer review for instructor
app.get('/api/instructor/attempts/:id/details', requireInstructor, (req: Request, res: Response) => {
  const { id } = req.params;
  const result = storage.getAttemptDetailedResult(id);
  if (!result) {
    res.status(404).json({ error: 'تفاصيل المحاولة غير موجودة' });
    return;
  }
  res.json({ success: true, ...result });
});

// Consolidated results report
app.get('/api/instructor/consolidated-report', requireInstructor, (_req: Request, res: Response) => {
  const attempts = storage.getAllAttempts().filter(a => a.status === 'submitted' || a.status === 'expired');
  const detailed = attempts.map(att => {
    const details = storage.getAttemptDetailedResult(att.id);
    return {
      attempt: att,
      questionsReview: details && !('error' in details) ? details.questionsReview : []
    };
  });

  res.json({
    success: true,
    totalAttempts: attempts.length,
    students: detailed
  });
});

// Audit logs
app.get('/api/instructor/audit-logs', requireInstructor, (_req: Request, res: Response) => {
  const logs = storage.getAuditLogs();
  res.json({ success: true, logs });
});

// Excel Export
app.get('/api/instructor/export/excel', requireInstructor, (_req: Request, res: Response) => {
  const attempts = storage.getAllAttempts();

  const rows = attempts.map(a => {
    let statusArabic = 'غير مكتمل';
    if (a.status === 'submitted') statusArabic = 'تم التسليم';
    if (a.status === 'expired') statusArabic = 'انتهى الوقت';
    if (a.status === 'active') statusArabic = 'جارٍ أداء الامتحان';
    if (a.status === 'reset') statusArabic = 'تمت إعادة التعيين';

    return {
      'اسم الطالب': a.student_name,
      'رقم المحاولة': a.attempt_number,
      'رقم طلب الدخول': a.access_request_id,
      'الدرجة من 50': a.score ?? '—',
      'النسبة المئوية': a.percentage !== undefined ? `${a.percentage}%` : '—',
      'الإجابات الصحيحة': a.correct_count ?? '—',
      'الإجابات الخاطئة': a.incorrect_count ?? '—',
      'الأسئلة غير المجابة': a.unanswered_count ?? '—',
      'تاريخ البدء': a.started_at ? new Date(a.started_at).toLocaleString('ar-EG') : '—',
      'تاريخ التسليم': a.submitted_at ? new Date(a.submitted_at).toLocaleString('ar-EG') : '—',
      'المدة (بالدقائق)': a.duration_seconds ? Math.round(a.duration_seconds / 60) : '—',
      'حالة الامتحان': statusArabic
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'نتائج الإجراءات الجمركية');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="customs_exam_results.xlsx"');
  res.send(buf);
});

// CSV Export
app.get('/api/instructor/export/csv', requireInstructor, (_req: Request, res: Response) => {
  const attempts = storage.getAllAttempts();

  const rows = attempts.map(a => {
    let statusArabic = 'غير مكتمل';
    if (a.status === 'submitted') statusArabic = 'تم التسليم';
    if (a.status === 'expired') statusArabic = 'انتهى الوقت';
    if (a.status === 'active') statusArabic = 'جارٍ أداء الامتحان';
    if (a.status === 'reset') statusArabic = 'تمت إعادة التعيين';

    return {
      'اسم الطالب': a.student_name,
      'رقم المحاولة': a.attempt_number,
      'رقم طلب الدخول': a.access_request_id,
      'الدرجة من 50': a.score ?? '',
      'النسبة المئوية': a.percentage !== undefined ? `${a.percentage}%` : '',
      'الإجابات الصحيحة': a.correct_count ?? '',
      'الإجابات الخاطئة': a.incorrect_count ?? '',
      'الأسئلة غير المجابة': a.unanswered_count ?? '',
      'تاريخ البدء': a.started_at ? new Date(a.started_at).toLocaleString('ar-EG') : '',
      'تاريخ التسليم': a.submitted_at ? new Date(a.submitted_at).toLocaleString('ar-EG') : '',
      'حالة الامتحان': statusArabic
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Add UTF-8 BOM so Arabic displays correctly in Excel
  const bom = '\uFEFF';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="customs_exam_results.csv"');
  res.send(bom + csv);
});

// ---------------- Vite Middleware or Static Production ----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Customs Exam System] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
