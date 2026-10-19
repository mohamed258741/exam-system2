import {
  AccessRequest,
  ExamAttempt,
  QuestionPublic,
  QuestionReviewItem,
  DashboardStats,
  MonitoringItem,
  AuditLog
} from './types';

const INSTRUCTOR_TOKEN_KEY = 'customs_instructor_token';
const STUDENT_REQUEST_ID_KEY = 'customs_student_request_id';
const STUDENT_ATTEMPT_ID_KEY = 'customs_student_attempt_id';

/**
 * Safely updates URL query parameters without triggering full page reloads.
 * This guarantees session retention across refreshes (F5) and prevents
 * cross-tab session pollution between different students.
 */
export function updateUrlParams(params: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState({}, '', url.toString());
  } catch {
    // fallback ignore
  }
}

export function getInstructorToken(): string | null {
  if (typeof window === 'undefined') return null;
  const sessionToken = sessionStorage.getItem(INSTRUCTOR_TOKEN_KEY);
  if (sessionToken) return sessionToken;
  const localToken = localStorage.getItem(INSTRUCTOR_TOKEN_KEY);
  if (localToken) {
    sessionStorage.setItem(INSTRUCTOR_TOKEN_KEY, localToken);
    return localToken;
  }
  return null;
}

export function setInstructorToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem(INSTRUCTOR_TOKEN_KEY, token);
    localStorage.setItem(INSTRUCTOR_TOKEN_KEY, token);
    updateUrlParams({ mode: 'instructor' });
  } else {
    sessionStorage.removeItem(INSTRUCTOR_TOKEN_KEY);
    localStorage.removeItem(INSTRUCTOR_TOKEN_KEY);
    updateUrlParams({ mode: null });
  }
}

export async function verifyInstructorSession(): Promise<boolean> {
  const token = getInstructorToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/instructor/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return true;
    }
    setInstructorToken(null);
    return false;
  } catch {
    // On temporary network hiccup, do not kick instructor out
    return true;
  }
}

export function getSavedStudentRequestId(): string | null {
  if (typeof window === 'undefined') return null;
  const urlParam = new URLSearchParams(window.location.search).get('req');
  if (urlParam && urlParam.trim()) {
    sessionStorage.setItem(STUDENT_REQUEST_ID_KEY, urlParam.trim());
    localStorage.setItem(STUDENT_REQUEST_ID_KEY, urlParam.trim());
    return urlParam.trim();
  }
  return sessionStorage.getItem(STUDENT_REQUEST_ID_KEY) || localStorage.getItem(STUDENT_REQUEST_ID_KEY);
}

export function setSavedStudentRequestId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    sessionStorage.setItem(STUDENT_REQUEST_ID_KEY, id);
    localStorage.setItem(STUDENT_REQUEST_ID_KEY, id);
    updateUrlParams({ req: id });
  } else {
    sessionStorage.removeItem(STUDENT_REQUEST_ID_KEY);
    localStorage.removeItem(STUDENT_REQUEST_ID_KEY);
    updateUrlParams({ req: null });
  }
}

export function getSavedStudentAttemptId(): string | null {
  if (typeof window === 'undefined') return null;
  const urlParam = new URLSearchParams(window.location.search).get('attempt');
  if (urlParam && urlParam.trim()) {
    sessionStorage.setItem(STUDENT_ATTEMPT_ID_KEY, urlParam.trim());
    localStorage.setItem(STUDENT_ATTEMPT_ID_KEY, urlParam.trim());
    return urlParam.trim();
  }
  return sessionStorage.getItem(STUDENT_ATTEMPT_ID_KEY) || localStorage.getItem(STUDENT_ATTEMPT_ID_KEY);
}

export function setSavedStudentAttemptId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    sessionStorage.setItem(STUDENT_ATTEMPT_ID_KEY, id);
    localStorage.setItem(STUDENT_ATTEMPT_ID_KEY, id);
    updateUrlParams({ attempt: id });
  } else {
    sessionStorage.removeItem(STUDENT_ATTEMPT_ID_KEY);
    localStorage.removeItem(STUDENT_ATTEMPT_ID_KEY);
    updateUrlParams({ attempt: null });
  }
}

export function getSavedQuestionIndex(attemptId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) {
      const parsed = parseInt(urlQ, 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed - 1;
    }
    const saved = sessionStorage.getItem(`customs_q_${attemptId}`) || localStorage.getItem(`customs_q_${attemptId}`);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {}
  return 0;
}

export function setSavedQuestionIndex(attemptId: string, index: number) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`customs_q_${attemptId}`, String(index));
    localStorage.setItem(`customs_q_${attemptId}`, String(index));
    updateUrlParams({ q: String(index + 1) });
  } catch {}
}

export function clearStudentSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STUDENT_REQUEST_ID_KEY);
  sessionStorage.removeItem(STUDENT_ATTEMPT_ID_KEY);
  localStorage.removeItem(STUDENT_REQUEST_ID_KEY);
  localStorage.removeItem(STUDENT_ATTEMPT_ID_KEY);
  updateUrlParams({ req: null, attempt: null, view: null, q: null });
}

// Student APIs
export async function submitStudentRequest(studentName: string): Promise<{ success: boolean; request?: AccessRequest; error?: string }> {
  try {
    const res = await fetch('/api/student/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'فشل إرسال الطلب' };
    }
    setSavedStudentRequestId(data.request.id);
    return { success: true, request: data.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function fetchStudentRequestStatus(requestId: string): Promise<{
  success: boolean;
  request?: AccessRequest;
  activeAttempt?: ExamAttempt | null;
  hasCompletedAttempt?: boolean;
  completedAttemptId?: string | null;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/student/request-status/${encodeURIComponent(requestId)}`);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر جلب حالة الطلب' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function startExamAttempt(requestId: string): Promise<{ success: boolean; attempt?: ExamAttempt; isNew?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/student/start-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر بدء الامتحان' };
    }
    if (data.attempt) {
      setSavedStudentAttemptId(data.attempt.id);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function fetchExamQuestions(attemptId: string): Promise<{
  success: boolean;
  attempt?: {
    id: string;
    student_name: string;
    status: string;
    started_at: string;
    deadline_at: string;
    remaining_seconds: number;
    is_locked: boolean;
  };
  questions?: QuestionPublic[];
  savedAnswers?: Record<number, 'أ' | 'ب' | 'ج' | 'د'>;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/student/exam/${encodeURIComponent(attemptId)}`);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر تحميل بيانات الامتحان' };
    }
    return { success: true, ...data };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function saveExamAnswer(attemptId: string, questionId: number, selectedOption: 'أ' | 'ب' | 'ج' | 'د'): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/student/exam/${encodeURIComponent(attemptId)}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, selectedOption })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر حفظ الإجابة' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في حفظ الإجابة' };
  }
}

export async function submitExam(attemptId: string): Promise<{ success: boolean; attempt?: ExamAttempt; error?: string }> {
  try {
    const res = await fetch(`/api/student/exam/${encodeURIComponent(attemptId)}/submit`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر تسليم الامتحان' };
    }
    return { success: true, attempt: data.attempt };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function fetchExamResults(attemptId: string): Promise<{
  success: boolean;
  attempt?: ExamAttempt;
  questionsReview?: QuestionReviewItem[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/student/exam/${encodeURIComponent(attemptId)}/results`);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر عرض النتيجة' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

// Instructor APIs
function getInstructorHeaders(): HeadersInit {
  const token = getInstructorToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function instructorLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/instructor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'كلمة المرور غير صحيحة' };
    }
    if (data.token) {
      setInstructorToken(data.token);
    }
    return { success: true, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function fetchInstructorStats(): Promise<{ success: boolean; stats?: DashboardStats; error?: string }> {
  try {
    const res = await fetch('/api/instructor/stats', {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchInstructorRequests(): Promise<{ success: boolean; requests?: AccessRequest[]; error?: string }> {
  try {
    const res = await fetch('/api/instructor/requests', {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function actionAccessRequest(
  requestId: string,
  status: 'approved' | 'rejected' | 'revoked',
  note?: string
): Promise<{ success: boolean; request?: AccessRequest; error?: string }> {
  try {
    const res = await fetch(`/api/instructor/requests/${encodeURIComponent(requestId)}/action`, {
      method: 'POST',
      headers: getInstructorHeaders(),
      body: JSON.stringify({ status, note })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchMonitoringData(): Promise<{ success: boolean; monitoring?: MonitoringItem[]; error?: string }> {
  try {
    const res = await fetch('/api/instructor/monitoring', {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAllAttempts(): Promise<{ success: boolean; attempts?: ExamAttempt[]; error?: string }> {
  try {
    const res = await fetch('/api/instructor/attempts', {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAttemptDetails(attemptId: string): Promise<{
  success: boolean;
  attempt?: ExamAttempt;
  questionsReview?: QuestionReviewItem[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/instructor/attempts/${encodeURIComponent(attemptId)}/details`, {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetStudentAttempt(attemptId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/instructor/attempts/${encodeURIComponent(attemptId)}/reset`, {
      method: 'POST',
      headers: getInstructorHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteStudentAttempt(attemptId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/instructor/attempts/${encodeURIComponent(attemptId)}/delete`, {
      method: 'POST',
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAccessRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/instructor/requests/${encodeURIComponent(requestId)}/delete`, {
      method: 'POST',
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function authorizeAdditionalAttempt(requestId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/instructor/requests/${encodeURIComponent(requestId)}/authorize-attempt`, {
      method: 'POST',
      headers: getInstructorHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAuditLogs(): Promise<{ success: boolean; logs?: AuditLog[]; error?: string }> {
  try {
    const res = await fetch('/api/instructor/audit-logs', {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchConsolidatedReport(): Promise<{
  success: boolean;
  totalAttempts?: number;
  students?: { attempt: ExamAttempt; questionsReview: QuestionReviewItem[] }[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/instructor/consolidated-report', {
      headers: getInstructorHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function changeInstructorPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/instructor/change-password', {
      method: 'POST',
      headers: getInstructorHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
