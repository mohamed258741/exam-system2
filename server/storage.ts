import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QUESTIONS_DATA, QuestionItem } from './questionsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface AccessRequest {
  id: string;
  request_number: number;
  student_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  reviewed_at?: string;
  allow_new_attempt?: boolean;
}

export interface ExamAttempt {
  id: string;
  access_request_id: string;
  student_name: string;
  attempt_number: number;
  started_at: string;
  deadline_at: string; // server authoritative: started_at + 60m
  submitted_at?: string;
  status: 'active' | 'submitted' | 'expired' | 'reset';
  score?: number;
  percentage?: number;
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
  duration_seconds?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  target_student?: string;
  timestamp: string;
}

interface DatabaseSchema {
  instructor: {
    password: string;
    updated_at: string;
    tokens?: string[];
  };
  request_counter: number;
  access_requests: AccessRequest[];
  exam_attempts: ExamAttempt[];
  student_answers: Record<string, Record<number, 'أ' | 'ب' | 'ج' | 'د'>>; // attemptId -> { questionId: option }
  audit_logs: AuditLog[];
}

const DEFAULT_DB: DatabaseSchema = {
  instructor: {
    password: 'Farida123',
    updated_at: new Date().toISOString(),
    tokens: []
  },
  request_counter: 100,
  access_requests: [],
  exam_attempts: [],
  student_answers: {},
  audit_logs: [
    {
      id: 'init-1',
      action: 'system_init',
      details: 'تهيئة نظام اختبارات الإجراءات الجمركية وتحميل بنك الأسئلة (50 سؤال)',
      timestamp: new Date().toISOString()
    }
  ]
};

class Storage {
  private db: DatabaseSchema = DEFAULT_DB;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = { ...DEFAULT_DB, ...JSON.parse(raw) };
      } else {
        this.saveSync();
      }
    } catch (err) {
      console.error('Failed to load database, using defaults:', err);
      this.db = DEFAULT_DB;
      this.saveSync();
    }

    // Auto-check for expired attempts every 15 seconds
    setInterval(() => {
      this.checkAndExpireAttempts();
    }, 15000);
  }

  private isSaving = false;
  private hasPendingSave = false;
  private lastSavedTime = Date.now();

  private saveSync() {
    if (this.isSaving) {
      this.hasPendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
      this.lastSavedTime = Date.now();
    } catch (err) {
      console.error('Failed to write database file atomically:', err);
    } finally {
      this.isSaving = false;
      if (this.hasPendingSave) {
        this.hasPendingSave = false;
        setTimeout(() => this.saveSync(), 50);
      }
    }
  }

  private queueSave(immediate = false) {
    if (immediate || Date.now() - this.lastSavedTime > 2000) {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
      this.saveSync();
      return;
    }
    if (this.saveTimeout) return; // already scheduled
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveSync();
    }, 300);
  }

  // Instructor
  getInstructorPassword(): string {
    return this.db.instructor.password;
  }

  updateInstructorPassword(newPassword: string): boolean {
    this.db.instructor.password = newPassword;
    this.db.instructor.updated_at = new Date().toISOString();
    this.addAuditLog('change_password', 'تم تغيير كلمة مرور المدرس بنجاح');
    this.queueSave(true);
    return true;
  }

  addInstructorToken(token: string) {
    if (!this.db.instructor.tokens) this.db.instructor.tokens = [];
    if (!this.db.instructor.tokens.includes(token)) {
      this.db.instructor.tokens.push(token);
      // Keep at most 30 recent active tokens
      if (this.db.instructor.tokens.length > 30) {
        this.db.instructor.tokens = this.db.instructor.tokens.slice(-30);
      }
      this.queueSave(true);
    }
  }

  isValidInstructorToken(token: string): boolean {
    if (!token) return false;
    if (!this.db.instructor.tokens) return false;
    return this.db.instructor.tokens.includes(token);
  }

  removeInstructorToken(token: string) {
    if (this.db.instructor.tokens) {
      this.db.instructor.tokens = this.db.instructor.tokens.filter(t => t !== token);
      this.queueSave(true);
    }
  }

  // Audit Logs
  addAuditLog(action: string, details: string, target_student?: string) {
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action,
      details,
      target_student,
      timestamp: new Date().toISOString()
    };
    this.db.audit_logs.unshift(log);
    // Keep last 500 logs
    if (this.db.audit_logs.length > 500) {
      this.db.audit_logs = this.db.audit_logs.slice(0, 500);
    }
    this.queueSave();
    return log;
  }

  getAuditLogs(): AuditLog[] {
    return this.db.audit_logs;
  }

  // Access Requests
  createAccessRequest(studentName: string): AccessRequest {
    const trimmed = studentName.trim();
    this.db.request_counter += 1;
    const req: AccessRequest = {
      id: 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000),
      request_number: this.db.request_counter,
      student_name: trimmed,
      requested_at: new Date().toISOString(),
      status: 'pending'
    };
    this.db.access_requests.unshift(req);
    this.addAuditLog('request_submitted', `طلب دخول امتحان جديد من الطالب: ${trimmed} (رقم الطلب #${req.request_number})`, trimmed);
    this.queueSave();
    return req;
  }

  getAccessRequest(id: string): AccessRequest | undefined {
    return this.db.access_requests.find(r => r.id === id);
  }

  getAllAccessRequests(): AccessRequest[] {
    return this.db.access_requests;
  }

  updateAccessRequestStatus(id: string, status: 'approved' | 'rejected' | 'revoked', instructorNote?: string): AccessRequest | null {
    const req = this.db.access_requests.find(r => r.id === id);
    if (!req) return null;
    req.status = status;
    req.reviewed_at = new Date().toISOString();

    const actionText = status === 'approved' ? 'موافقة على الدخول' : status === 'rejected' ? 'رفض الطلب' : 'إلغاء الإذن بالدخول';
    this.addAuditLog(status, `تم ${actionText} للطالب: ${req.student_name} (رقم الطلب #${req.request_number})${instructorNote ? ' - ' + instructorNote : ''}`, req.student_name);

    this.queueSave();
    return req;
  }

  // Exam Attempts
  getAttempt(attemptId: string): ExamAttempt | undefined {
    // Check expiration before returning
    this.checkAttemptExpiration(attemptId);
    return this.db.exam_attempts.find(a => a.id === attemptId);
  }

  getAttemptsForRequest(requestId: string): ExamAttempt[] {
    return this.db.exam_attempts.filter(a => a.access_request_id === requestId);
  }

  getAllAttempts(): ExamAttempt[] {
    // Check all active attempts first
    this.checkAndExpireAttempts();
    return this.db.exam_attempts;
  }

  startExamAttempt(requestId: string): { attempt: ExamAttempt; isNew: boolean } | { error: string } {
    const req = this.getAccessRequest(requestId);
    if (!req) {
      return { error: 'طلب الدخول غير موجود' };
    }
    if (req.status !== 'approved') {
      return { error: 'لم تتم الموافقة على طلب الدخول بعد' };
    }

    // Check existing attempts for this request
    const existing = this.db.exam_attempts.filter(a => a.access_request_id === requestId);
    const activeAttempt = existing.find(a => a.status === 'active');

    if (activeAttempt) {
      // Check if expired
      const now = Date.now();
      const deadline = new Date(activeAttempt.deadline_at).getTime();
      if (now >= deadline) {
        this.finalizeAttempt(activeAttempt.id, 'expired');
        return { error: 'انتهت مدة الامتحان (60 دقيقة) وتم تسليمه تلقائياً.' };
      }
      return { attempt: activeAttempt, isNew: false };
    }

    // If student already has a completed attempt and no reset or additional attempt was authorized
    const completedAttempt = existing.find(a => a.status === 'submitted' || a.status === 'expired');
    if (completedAttempt && !req.allow_new_attempt) {
      return { error: 'لقد أكملت أداء الامتحان بالفعل. لا يُسمح بمحاولة جديدة إلا بإذن المدرس.' };
    }

    // Clear the authorized attempt flag once consumed
    if (req.allow_new_attempt) {
      req.allow_new_attempt = false;
    }

    // Create fresh authorized attempt
    const startTime = new Date();
    // Authoritative 60 minutes
    const deadlineTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const attemptNumber = existing.length + 1;
    const attempt: ExamAttempt = {
      id: 'ATT-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
      access_request_id: requestId,
      student_name: req.student_name,
      attempt_number: attemptNumber,
      started_at: startTime.toISOString(),
      deadline_at: deadlineTime.toISOString(),
      status: 'active'
    };

    this.db.exam_attempts.unshift(attempt);
    this.db.student_answers[attempt.id] = {};
    this.addAuditLog('exam_started', `بدء امتحان جديد للطالب: ${req.student_name} (محاولة رقم ${attemptNumber})`, req.student_name);
    this.queueSave();

    return { attempt, isNew: true };
  }

  saveStudentAnswer(attemptId: string, questionId: number, selectedOption: 'أ' | 'ب' | 'ج' | 'د'): { success: boolean; error?: string } {
    const attempt = this.db.exam_attempts.find(a => a.id === attemptId);
    if (!attempt) {
      return { success: false, error: 'المحاولة غير موجودة' };
    }

    if (attempt.status !== 'active') {
      return { success: false, error: 'تم قفل الامتحان ولا يمكن تعديل الإجابات.' };
    }

    // Authoritative deadline check
    const now = Date.now();
    const deadline = new Date(attempt.deadline_at).getTime();
    if (now >= deadline) {
      this.finalizeAttempt(attemptId, 'expired');
      return { success: false, error: 'انتهى وقت الامتحان (60 دقيقة). تم حفظ الامتحان تلقائياً وقفله.' };
    }

    if (!this.db.student_answers[attemptId]) {
      this.db.student_answers[attemptId] = {};
    }

    this.db.student_answers[attemptId][questionId] = selectedOption;
    this.queueSave();
    return { success: true };
  }

  getStudentAnswers(attemptId: string): Record<number, 'أ' | 'ب' | 'ج' | 'د'> {
    return this.db.student_answers[attemptId] || {};
  }

  finalizeAttempt(attemptId: string, finalStatus: 'submitted' | 'expired'): ExamAttempt | null {
    const attempt = this.db.exam_attempts.find(a => a.id === attemptId);
    if (!attempt) return null;

    if (attempt.status === 'submitted' || attempt.status === 'expired') {
      return attempt; // Already finalized
    }

    const answers = this.db.student_answers[attemptId] || {};
    const submitTime = new Date();
    attempt.submitted_at = submitTime.toISOString();
    attempt.status = finalStatus;

    // Calculate duration
    const startTime = new Date(attempt.started_at).getTime();
    const endTime = submitTime.getTime();
    const durationSeconds = Math.min(3600, Math.max(0, Math.round((endTime - startTime) / 1000)));
    attempt.duration_seconds = durationSeconds;

    // Automatic grading against confidential answer key
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    QUESTIONS_DATA.forEach(q => {
      const studentAns = answers[q.id];
      if (!studentAns) {
        unansweredCount++;
      } else if (studentAns === q.correct_option) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    attempt.score = correctCount; // 1 point each out of 50
    attempt.percentage = Math.round((correctCount / QUESTIONS_DATA.length) * 100 * 10) / 10;
    attempt.correct_count = correctCount;
    attempt.incorrect_count = incorrectCount;
    attempt.unanswered_count = unansweredCount;

    const statusNote = finalStatus === 'submitted' ? 'تسليم يدوي' : 'تسليم آلي لانتهاء الوقت';
    this.addAuditLog(
      'exam_finalized',
      `اكتمل امتحان الطالب: ${attempt.student_name} (${statusNote}) - النتيجة: ${correctCount}/50 (${attempt.percentage}%)`,
      attempt.student_name
    );

    this.queueSave();
    return attempt;
  }

  private checkAttemptExpiration(attemptId: string) {
    const attempt = this.db.exam_attempts.find(a => a.id === attemptId);
    if (attempt && attempt.status === 'active') {
      const now = Date.now();
      const deadline = new Date(attempt.deadline_at).getTime();
      if (now >= deadline) {
        this.finalizeAttempt(attemptId, 'expired');
      }
    }
  }

  checkAndExpireAttempts() {
    const now = Date.now();
    for (const attempt of this.db.exam_attempts) {
      if (attempt.status === 'active') {
        const deadline = new Date(attempt.deadline_at).getTime();
        if (now >= deadline) {
          this.finalizeAttempt(attempt.id, 'expired');
        }
      }
    }
  }

  resetAttempt(attemptId: string, instructorReason?: string): boolean {
    const attempt = this.db.exam_attempts.find(a => a.id === attemptId);
    if (!attempt) return false;

    // Archive / mark as reset rather than silently deleting to preserve audit history
    attempt.status = 'reset';
    this.addAuditLog(
      'attempt_reset',
      `تمت إعادة تعيين محاولة الطالب: ${attempt.student_name} (محاولة رقم ${attempt.attempt_number})${instructorReason ? ' - السبب: ' + instructorReason : ''}`,
      attempt.student_name
    );
    this.queueSave();
    return true;
  }

  authorizeAdditionalAttempt(requestId: string, instructorReason?: string): boolean {
    const req = this.getAccessRequest(requestId);
    if (!req) return false;
    req.status = 'approved';
    req.allow_new_attempt = true;
    this.addAuditLog(
      'additional_attempt_authorized',
      `تم السماح بمحاولة امتحان إضافية للطالب: ${req.student_name} (رقم الطلب #${req.request_number})${instructorReason ? ' - ' + instructorReason : ''}`,
      req.student_name
    );
    this.queueSave();
    return true;
  }

  deleteAttempt(attemptId: string): boolean {
    const index = this.db.exam_attempts.findIndex(a => a.id === attemptId);
    if (index === -1) return false;
    const attempt = this.db.exam_attempts[index];
    this.db.exam_attempts.splice(index, 1);
    delete this.db.student_answers[attemptId];
    this.addAuditLog(
      'attempt_deleted',
      `تم حذف محاولة الطالب نهائياً: ${attempt.student_name} (محاولة رقم ${attempt.attempt_number})`,
      attempt.student_name
    );
    this.queueSave(true);
    return true;
  }

  deleteAccessRequest(requestId: string): boolean {
    const index = this.db.access_requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    const req = this.db.access_requests[index];
    this.db.access_requests.splice(index, 1);

    // Also delete any associated attempts and answers
    const relatedAttempts = this.db.exam_attempts.filter(a => a.access_request_id === requestId);
    for (const att of relatedAttempts) {
      delete this.db.student_answers[att.id];
    }
    this.db.exam_attempts = this.db.exam_attempts.filter(a => a.access_request_id !== requestId);

    this.addAuditLog(
      'request_deleted',
      `تم حذف طلب دخول الطالب وسجلاته نهائياً: ${req.student_name} (رقم الطلب #${req.request_number})`,
      req.student_name
    );
    this.queueSave(true);
    return true;
  }

  // Dashboard Stats
  getDashboardStats() {
    this.checkAndExpireAttempts();
    const totalRequests = this.db.access_requests.length;
    const pendingRequests = this.db.access_requests.filter(r => r.status === 'pending').length;
    const approvedRequests = this.db.access_requests.filter(r => r.status === 'approved').length;

    const inProgressExams = this.db.exam_attempts.filter(a => a.status === 'active').length;
    const completedAttempts = this.db.exam_attempts.filter(a => a.status === 'submitted' || a.status === 'expired');
    const completedExams = completedAttempts.length;

    const expiredDueToTime = this.db.exam_attempts.filter(a => a.status === 'expired').length;

    let totalScores = 0;
    let topScore = 0;

    completedAttempts.forEach(a => {
      const s = a.score || 0;
      totalScores += s;
      if (s > topScore) topScore = s;
    });

    const averageScore = completedExams > 0 ? Math.round((totalScores / completedExams) * 10) / 10 : 0;

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      inProgressExams,
      completedExams,
      averageScore,
      topScore,
      expiredDueToTime
    };
  }

  // Detailed Result for an attempt (includes full questions & correctness)
  getAttemptDetailedResult(attemptId: string) {
    this.checkAttemptExpiration(attemptId);
    const attempt = this.db.exam_attempts.find(a => a.id === attemptId);
    if (!attempt) return null;

    // Must be finalized
    if (attempt.status === 'active') {
      return { error: 'الامتحان ما زال قيد الأداء وغير متاح للمراجعة بعد.' };
    }

    const answers = this.db.student_answers[attemptId] || {};

    const questionsReview = QUESTIONS_DATA.map(q => {
      const studentOption = answers[q.id] || null;
      const isCorrect = studentOption === q.correct_option;
      const isUnanswered = studentOption === null;

      let statusArabic: 'إجابة صحيحة' | 'إجابة خاطئة' | 'لم تتم الإجابة';
      if (isUnanswered) {
        statusArabic = 'لم تتم الإجابة';
      } else if (isCorrect) {
        statusArabic = 'إجابة صحيحة';
      } else {
        statusArabic = 'إجابة خاطئة';
      }

      return {
        id: q.id,
        question_number: q.question_number,
        question_text: q.question_text,
        options: q.options,
        student_option: studentOption,
        student_option_text: studentOption ? q.options.find(o => o.key === studentOption)?.text || '' : '',
        correct_option: q.correct_option,
        correct_option_text: q.options.find(o => o.key === q.correct_option)?.text || '',
        is_correct: isCorrect,
        is_unanswered: isUnanswered,
        status_label: statusArabic,
        points_earned: isCorrect ? 1 : 0
      };
    });

    return {
      attempt,
      questionsReview
    };
  }
}

export const storage = new Storage();
