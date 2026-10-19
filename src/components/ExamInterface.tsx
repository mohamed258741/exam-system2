import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  Circle,
  HelpCircle,
  ShieldCheck,
  Save
} from 'lucide-react';
import { QuestionPublic } from '../types';
import { saveExamAnswer, submitExam, getSavedQuestionIndex, setSavedQuestionIndex } from '../api';

interface ExamInterfaceProps {
  attemptId: string;
  studentName: string;
  deadlineAt: string;
  initialRemainingSeconds: number;
  questions: QuestionPublic[];
  initialAnswers: Record<number, 'أ' | 'ب' | 'ج' | 'د'>;
  onExamFinalized: (attemptId: string) => void;
  onExitExam?: () => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  attemptId,
  studentName,
  deadlineAt,
  initialRemainingSeconds,
  questions,
  initialAnswers,
  onExamFinalized,
  onExitExam
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const saved = getSavedQuestionIndex(attemptId);
    return saved >= 0 && saved < questions.length ? saved : 0;
  });
  const [answers, setAnswers] = useState<Record<number, 'أ' | 'ب' | 'ج' | 'د'>>(() => {
    try {
      const backup = sessionStorage.getItem(`customs_ans_${attemptId}`);
      if (backup) {
        return { ...JSON.parse(backup), ...initialAnswers };
      }
    } catch {}
    return initialAnswers;
  });
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [expiredAlert, setExpiredAlert] = useState(false);

  const deadlineMs = new Date(deadlineAt).getTime();
  const currentQuestion = questions[currentIndex] || questions[0];

  // Keep saved question index synced across tab refreshes
  useEffect(() => {
    setSavedQuestionIndex(attemptId, currentIndex);
  }, [attemptId, currentIndex]);

  // Keep local backup of answers in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(`customs_ans_${attemptId}`, JSON.stringify(answers));
    } catch {}
  }, [attemptId, answers]);

  // Authoritative countdown timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((deadlineMs - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineMs]);

  const handleTimeExpired = async () => {
    setExpiredAlert(true);
    try {
      await submitExam(attemptId);
      setTimeout(() => {
        onExamFinalized(attemptId);
      }, 1500);
    } catch {
      onExamFinalized(attemptId);
    }
  };

  const handleSelectOption = async (optionKey: 'أ' | 'ب' | 'ج' | 'د') => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionKey
    }));
    setSaveStatus('saving');

    const res = await saveExamAnswer(attemptId, currentQuestion.id, optionKey);
    if (res.success) {
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
      if (res.error?.includes('انتهى وقت الامتحان')) {
        handleTimeExpired();
      }
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitExam(attemptId);
      if (res.success) {
        onExamFinalized(attemptId);
      } else {
        alert(res.error || 'تعذر تسليم الامتحان');
        setIsSubmitting(false);
      }
    } catch {
      alert('خطأ في الاتصال بالخادم أثناء التسليم');
      setIsSubmitting(false);
    }
  };

  // Timer format (MM:SS)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isTimeCritical = remainingSeconds < 300; // less than 5 minutes

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Examination Sticky Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-sm border border-white/20 flex items-center justify-center shrink-0">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>الأكاديمية العربية — اختبار الإجراءات الجمركية</span>
              <span className="text-slate-500 text-xs">|</span>
              <span className="text-amber-400 font-semibold text-xs">{studentName}</span>
            </div>
            <div className="text-xs text-slate-400">
              تمت الإجابة عن {answeredCount} من {questions.length} سؤال
            </div>
          </div>
        </div>

        {/* Autoritative Timer & Save Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            {saveStatus === 'saving' && (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                جارٍ الحفظ...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم الحفظ تلقائياً
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400">خطأ في الحفظ</span>
            )}
          </div>

          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-base sm:text-lg tabular-nums ${
              isTimeCritical
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-slate-950 border-slate-700 text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-400/20"
          >
            <span>تسليم الامتحان</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content: Split Question Stage & Navigation Palette */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Column: Active Question Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-right">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-amber-400">
                <span>السؤال رقم {currentQuestion.question_number}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400 font-normal">من 50 سؤال</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                درجة واحدة
              </div>
            </div>

            {/* Question Text */}
            <div className="text-lg sm:text-xl font-semibold text-white leading-relaxed mb-8">
              {currentQuestion.question_text}
            </div>

            {/* Options List */}
            <div className="space-y-3.5 mb-8">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full p-4 rounded-2xl border text-right transition-all flex items-start gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-950'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <div className="text-base font-medium flex-1 pt-0.5 leading-snug">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons: Previous / Next */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              <div className="text-xs text-slate-400">
                {answers[currentQuestion.id] ? (
                  <span className="text-emerald-400 font-medium">تمت الإجابة عن هذا السؤال</span>
                ) : (
                  <span className="text-amber-400/80">لم تتم الإجابة بعد</span>
                )}
              </div>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>السؤال التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette & Review Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-right">
            <h3 className="text-base font-bold text-white mb-2">
              لوحة التنقل بين الأسئلة
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              يمكنك الضغط على أي سؤال للانتقال إليه مباشرة
            </p>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-950/80 rounded-xl mb-4 border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-400 inline-block" />
                <span className="text-slate-300">مجاب ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700 inline-block" />
                <span className="text-slate-400">غير مجاب ({unansweredCount})</span>
              </div>
            </div>

            {/* 50 Questions Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[380px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-white scale-105 z-10 ' + (isAnswered ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-white')
                        : isAnswered
                        ? 'bg-amber-500/25 border border-amber-400/50 text-amber-300 hover:bg-amber-500/40'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {q.question_number}
                  </button>
                );
              })}
            </div>

            {/* Submit Final Action */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-sm cursor-pointer"
              >
                <span>تسليم الامتحان النهائي</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-3">
              تأكيد تسليم الامتحان
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed text-center mb-6">
              هل أنت متأكد من تسليم الامتحان؟ لن تتمكن من تعديل إجاباتك بعد التسليم، وسيتم احتساب الدرجة فورياً.
            </p>

            <div className="bg-slate-950 rounded-2xl p-4 mb-6 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>إجمالي الأسئلة:</span>
                <span className="font-bold text-white">50 سؤال</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>الأسئلة التي تمت الإجابة عنها:</span>
                <span className="font-bold text-emerald-400">{answeredCount} سؤال</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>الأسئلة المتبقية دون إجابة:</span>
                <span className="font-bold text-amber-400">{unansweredCount} سؤال</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جارٍ التسليم...' : 'تأكيد التسليم'}
              </button>

              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors text-sm cursor-pointer disabled:opacity-50"
              >
                العودة إلى الامتحان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-expired Notice */}
      {expiredAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">انتهى الوقت (60 دقيقة)</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              تم انتهاء الوقت المحدد للامتحان. يتم الآن حفظ جميع إجاباتك وإغلاق المحاولة آلياً وعرض النتيجة...
            </p>
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
