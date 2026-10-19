export interface QuestionOption {
  key: 'أ' | 'ب' | 'ج' | 'د';
  text: string;
}

export interface QuestionPublic {
  id: number;
  question_number: number;
  question_text: string;
  options: QuestionOption[];
  points: number;
}

export interface QuestionReviewItem {
  id: number;
  question_number: number;
  question_text: string;
  options: QuestionOption[];
  student_option: 'أ' | 'ب' | 'ج' | 'د' | null;
  student_option_text: string;
  correct_option: 'أ' | 'ب' | 'ج' | 'د';
  correct_option_text: string;
  is_correct: boolean;
  is_unanswered: boolean;
  status_label: 'إجابة صحيحة' | 'إجابة خاطئة' | 'لم تتم الإجابة';
  points_earned: number;
}

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
  deadline_at: string;
  submitted_at?: string;
  status: 'active' | 'submitted' | 'expired' | 'reset';
  score?: number;
  percentage?: number;
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
  duration_seconds?: number;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  inProgressExams: number;
  completedExams: number;
  averageScore: number;
  topScore: number;
  expiredDueToTime: number;
}

export interface MonitoringItem {
  requestId: string;
  requestNumber: number;
  studentName: string;
  approvedAt: string;
  attemptId: string | null;
  attemptNumber: number;
  startedAt: string | null;
  submittedAt: string | null;
  remainingSeconds: number;
  answeredCount: number;
  unansweredCount: number;
  examStatusLabel: string;
  rawStatus: 'active' | 'submitted' | 'expired' | 'reset' | 'not_started';
  score: number | null;
  percentage: number | null;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  target_student?: string;
  timestamp: string;
}
