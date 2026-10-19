import React, { useState, useEffect } from 'react';
import {
  AccessRequest,
  ExamAttempt,
  QuestionPublic,
  QuestionReviewItem
} from './types';
import {
  submitStudentRequest,
  fetchStudentRequestStatus,
  startExamAttempt,
  fetchExamQuestions,
  fetchExamResults,
  getInstructorToken,
  setInstructorToken,
  verifyInstructorSession,
  getSavedStudentRequestId,
  setSavedStudentRequestId,
  getSavedStudentAttemptId,
  setSavedStudentAttemptId,
  clearStudentSession
} from './api';
import { StudentLanding } from './components/StudentLanding';
import { StudentWaiting } from './components/StudentWaiting';
import { ExamInstructions } from './components/ExamInstructions';
import { ExamInterface } from './components/ExamInterface';
import { StudentResults } from './components/StudentResults';
import { InstructorLogin } from './components/InstructorLogin';
import { InstructorDashboard } from './components/InstructorDashboard';

type AppView = 'landing' | 'waiting' | 'instructions' | 'exam' | 'results' | 'instructor';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [showInstructorLoginModal, setShowInstructorLoginModal] = useState(false);

  // Student State
  const [studentRequest, setStudentRequest] = useState<AccessRequest | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<QuestionPublic[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<Record<number, 'أ' | 'ب' | 'ج' | 'د'>>({});
  const [deadlineAt, setDeadlineAt] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);

  // Results State
  const [resultsAttempt, setResultsAttempt] = useState<ExamAttempt | null>(null);
  const [questionsReview, setQuestionsReview] = useState<QuestionReviewItem[]>([]);

  // UI Loaders & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    let isCancelled = false;

    const resumeSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isInstructorParam = urlParams.get('mode') === 'instructor';
        const instToken = getInstructorToken();

        // 1. Instructor session check: if instructor token exists, verify with server
        const hasStudentParams = urlParams.has('req') || urlParams.has('attempt');
        if (instToken && (isInstructorParam || !hasStudentParams)) {
          const isValid = await verifyInstructorSession();
          if (isValid && !isCancelled) {
            setInstructorToken(instToken);
            setCurrentView('instructor');
            setIsRestoringSession(false);
            return;
          }
        }

        // 2. Student attempt session check (takes priority if active)
        const savedAttemptId = getSavedStudentAttemptId();
        const savedReqId = getSavedStudentRequestId();
        const isResultsView = urlParams.get('view') === 'results';

        if (savedAttemptId) {
          try {
            const res = await fetchExamQuestions(savedAttemptId);
            if (res.success && res.attempt && res.questions) {
              if (res.attempt.is_locked || isResultsView) {
                if (!isCancelled) {
                  await loadResultsView(savedAttemptId);
                  setIsRestoringSession(false);
                }
                return;
              } else {
                if (!isCancelled) {
                  setQuestions(res.questions);
                  setSavedAnswers(res.savedAnswers || {});
                  setDeadlineAt(res.attempt.deadline_at);
                  setRemainingSeconds(res.attempt.remaining_seconds);
                  setActiveAttempt({
                    id: res.attempt.id,
                    access_request_id: savedReqId || '',
                    student_name: res.attempt.student_name,
                    attempt_number: 1,
                    started_at: res.attempt.started_at,
                    deadline_at: res.attempt.deadline_at,
                    status: 'active'
                  });
                  setCurrentView('exam');
                  setIsRestoringSession(false);
                }
                return;
              }
            }
          } catch (e) {
            console.warn('Attempt could not be fetched, falling back:', e);
          }
        }

        // 3. Student request session check
        if (savedReqId) {
          try {
            const statusRes = await fetchStudentRequestStatus(savedReqId);
            if (statusRes.success && statusRes.request) {
              if (!isCancelled) {
                setStudentRequest(statusRes.request);
                if (statusRes.hasCompletedAttempt && statusRes.completedAttemptId && !statusRes.request.allow_new_attempt) {
                  await loadResultsView(statusRes.completedAttemptId);
                  setIsRestoringSession(false);
                  return;
                } else if (statusRes.request.status === 'approved') {
                  setCurrentView('instructions');
                  setIsRestoringSession(false);
                  return;
                } else {
                  setCurrentView('waiting');
                  setIsRestoringSession(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('Request status could not be fetched:', e);
          }
        }

        // Default: If no valid session is active, show clean landing page
        if (!isCancelled) {
          setCurrentView('landing');
          setIsRestoringSession(false);
        }
      } catch {
        if (!isCancelled) {
          setCurrentView('landing');
          setIsRestoringSession(false);
        }
      }
    };

    resumeSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Real-time listener for waiting screen
  useEffect(() => {
    if (currentView !== 'waiting' || !studentRequest) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'request_updated' && parsed.data.id === studentRequest.id) {
            setStudentRequest(parsed.data);
            if (parsed.data.status === 'approved') {
              // Automatically advance to instructions
              setTimeout(() => {
                setCurrentView('instructions');
              }, 1000);
            }
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    // Polling fallback every 2.5s
    const pollInterval = setInterval(async () => {
      const res = await fetchStudentRequestStatus(studentRequest.id);
      if (res.success && res.request) {
        setStudentRequest(res.request);
        if (res.request.status === 'approved') {
          clearInterval(pollInterval);
          setCurrentView('instructions');
        }
      }
    }, 2500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [currentView, studentRequest]);

  // Student Actions
  const handleStudentSubmitName = async (name: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Clean any old attempt ID before creating new request
    setSavedStudentAttemptId(null);

    const res = await submitStudentRequest(name);
    setIsLoading(false);

    if (res.success && res.request) {
      setStudentRequest(res.request);
      setSavedStudentRequestId(res.request.id);
      setCurrentView('waiting');
    } else {
      setErrorMessage(res.error || 'تعذر إرسال الطلب');
    }
  };

  const handleRefreshWaitingStatus = async () => {
    if (!studentRequest) return;
    setIsLoading(true);
    const res = await fetchStudentRequestStatus(studentRequest.id);
    setIsLoading(false);
    if (res.success && res.request) {
      setStudentRequest(res.request);
      if (res.request.status === 'approved') {
        setCurrentView('instructions');
      }
    }
  };

  const handleStartExam = async () => {
    if (!studentRequest) return;
    setIsLoading(true);
    setErrorMessage(null);

    const res = await startExamAttempt(studentRequest.id);
    if (res.success && res.attempt) {
      setActiveAttempt(res.attempt);
      setSavedStudentAttemptId(res.attempt.id);

      // Fetch questions
      const qRes = await fetchExamQuestions(res.attempt.id);
      setIsLoading(false);
      if (qRes.success && qRes.questions && qRes.attempt) {
        setQuestions(qRes.questions);
        setSavedAnswers(qRes.savedAnswers || {});
        setDeadlineAt(qRes.attempt.deadline_at);
        setRemainingSeconds(qRes.attempt.remaining_seconds);
        setCurrentView('exam');
      } else {
        setErrorMessage(qRes.error || 'تعذر تحميل الأسئلة');
      }
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || 'تعذر بدء الامتحان');
    }
  };

  const loadResultsView = async (attemptId: string) => {
    setIsLoading(true);
    try {
      setSavedStudentAttemptId(attemptId);
      const res = await fetchExamResults(attemptId);
      if (res.success && res.attempt && res.questionsReview) {
        setResultsAttempt(res.attempt);
        setQuestionsReview(res.questionsReview);
        setCurrentView('results');
      } else {
        alert(res.error || 'تعذر جلب نتيجة الامتحان');
      }
    } catch {
      alert('خطأ في جلب نتيجة الامتحان');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamFinalized = async (attemptId: string) => {
    await loadResultsView(attemptId);
  };

  const handleCancelRequestAndReset = () => {
    clearStudentSession();
    setStudentRequest(null);
    setActiveAttempt(null);
    setResultsAttempt(null);
    setQuestionsReview([]);
    setCurrentView('landing');
  };

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950 text-center" dir="rtl">
        <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-2xl border-2 border-amber-400/40 mb-5 flex items-center justify-center animate-pulse">
          <img src="/aastmt_logo.png" alt="شعار الأكاديمية" className="w-full h-full object-contain" />
        </div>
        <div className="text-xs font-bold text-amber-400 mb-1">الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري</div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">منظومة اختبارات الإجراءات الجمركية</h2>
        <p className="text-xs text-slate-400 mb-6 flex items-center gap-2 justify-center">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          جارٍ التحقق واستعادة جلسة الامتحان المعتمدة...
        </p>
        <button
          onClick={() => {
            clearStudentSession();
            setCurrentView('landing');
            setIsRestoringSession(false);
          }}
          className="text-xs text-slate-400 hover:text-amber-400 underline underline-offset-4 cursor-pointer"
        >
          بدء جلسة جديدة لطالب آخر
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      {/* View Router */}
      {currentView === 'landing' && (
        <StudentLanding
          onSubmitName={handleStudentSubmitName}
          onOpenInstructorLogin={() => setShowInstructorLoginModal(true)}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {currentView === 'waiting' && studentRequest && (
        <StudentWaiting
          request={studentRequest}
          onProceedToInstructions={() => setCurrentView('instructions')}
          onRefreshStatus={handleRefreshWaitingStatus}
          isChecking={isLoading}
          onCancelRequest={handleCancelRequestAndReset}
        />
      )}

      {currentView === 'instructions' && studentRequest && (
        <ExamInstructions
          request={studentRequest}
          onStartExam={handleStartExam}
          isStarting={isLoading}
          errorMessage={errorMessage}
          onCancelExam={handleCancelRequestAndReset}
        />
      )}

      {currentView === 'exam' && activeAttempt && (
        <ExamInterface
          attemptId={activeAttempt.id}
          studentName={activeAttempt.student_name}
          deadlineAt={deadlineAt}
          initialRemainingSeconds={remainingSeconds}
          questions={questions}
          initialAnswers={savedAnswers}
          onExamFinalized={handleExamFinalized}
          onExitExam={handleCancelRequestAndReset}
        />
      )}

      {currentView === 'results' && resultsAttempt && (
        <StudentResults
          attempt={resultsAttempt}
          questionsReview={questionsReview}
          onReturnHome={handleCancelRequestAndReset}
        />
      )}

      {currentView === 'instructor' && (
        <InstructorDashboard
          onLogout={() => {
            setCurrentView('landing');
          }}
        />
      )}

      {/* Instructor Login Modal */}
      {showInstructorLoginModal && (
        <InstructorLogin
          onSuccess={() => {
            setShowInstructorLoginModal(false);
            setCurrentView('instructor');
          }}
          onCancel={() => setShowInstructorLoginModal(false)}
        />
      )}
    </div>
  );
}
