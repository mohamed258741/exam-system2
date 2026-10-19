import React, { useState, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Hash,
  FileText,
  RotateCcw,
  LogOut
} from 'lucide-react';
import { ExamAttempt, QuestionReviewItem } from '../types';
import { downloadFormalStudentPdf, openFormalPrintWindow } from '../utils/formalPdfReport';

interface StudentResultsProps {
  attempt: ExamAttempt;
  questionsReview: QuestionReviewItem[];
  onReturnHome: () => void;
}

export const StudentResults: React.FC<StudentResultsProps> = ({
  attempt,
  questionsReview,
  onReturnHome
}) => {
  const [reviewMode, setReviewMode] = useState<'single' | 'all'>('single');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const currentQ = questionsReview[reviewIndex] || questionsReview[0];
  const score = attempt.score ?? 0;
  const percentage = attempt.percentage ?? 0;
  const correctCount = attempt.correct_count ?? 0;
  const incorrectCount = attempt.incorrect_count ?? 0;
  const unansweredCount = attempt.unanswered_count ?? 0;

  const durationMin = attempt.duration_seconds
    ? Math.floor(attempt.duration_seconds / 60)
    : 0;
  const durationSec = attempt.duration_seconds
    ? attempt.duration_seconds % 60
    : 0;

  const isPassed = score >= 25; // standard 50% passing threshold

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadFormalStudentPdf(attempt, questionsReview);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print window
      openFormalPrintWindow(attempt, questionsReview);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    openFormalPrintWindow(attempt, questionsReview);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Printable/Exportable Container */}
        <div className="p-2 sm:p-4 rounded-3xl bg-slate-950">
          {/* Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-right mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl border border-white/20 flex items-center justify-center shrink-0">
                  <img
                    src="/aastmt_logo.png"
                    alt="شعار الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                    <Award className="w-4 h-4" />
                    <span>الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري — نتيجة معتمدة</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    شهادة نتيجة امتحان الإجراءات الجمركية
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">
                    تقييم الكفاءة المهنية والتشريعات الجمركية رقم 207 لسنة 2020
                  </p>
                </div>
              </div>

              {/* Status Seal */}
              <div
                className={`px-6 py-4 rounded-2xl border text-center self-start sm:self-auto ${
                  isPassed
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-950/60 border-red-500/40 text-red-400'
                }`}
              >
                <div className="text-2xl font-black">{isPassed ? 'ناجح' : 'راسب'}</div>
                <div className="text-xs opacity-90">{percentage}% من المجموع الكلي</div>
              </div>
            </div>

            {/* Scorecard Hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">الدرجة النهائية</div>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">
                  {score} <span className="text-sm font-normal text-slate-500">/ 50</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">الإجابات الصحيحة</div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums">
                  {correctCount}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">الإجابات الخاطئة</div>
                <div className="text-3xl sm:text-4xl font-black text-red-400 tabular-nums">
                  {incorrectCount}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">غير المجابة</div>
                <div className="text-3xl sm:text-4xl font-black text-slate-400 tabular-nums">
                  {unansweredCount}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">اسم الطالب:</span>
                <span className="font-bold text-white text-sm">{attempt.student_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">رقم طلب الدخول:</span>
                <span className="font-mono text-slate-300 font-semibold">{attempt.access_request_id}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">تاريخ الامتحان:</span>
                <span className="text-slate-300">
                  {new Date(attempt.started_at).toLocaleDateString('ar-EG')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">وقت البدء:</span>
                <span className="text-slate-300">
                  {new Date(attempt.started_at).toLocaleTimeString('ar-EG')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">وقت التسليم:</span>
                <span className="text-slate-300">
                  {attempt.submitted_at
                    ? new Date(attempt.submitted_at).toLocaleTimeString('ar-EG')
                    : '—'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">المدة المستغرقة:</span>
                <span className="text-slate-300 font-bold">
                  {durationMin} دقيقة و {durationSec} ثانية
                </span>
              </div>
            </div>
          </div>

          {/* Action Strip: PDF / Print / View Switcher (no-print) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-400/20 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'جارٍ تحميل الـ PDF...' : 'تحميل الشهادة والنتيجة PDF'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>معاينة وطباعة رسمية</span>
              </button>

              <button
                onClick={onReturnHome}
                className="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-300 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>دخول طالب جديد</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setReviewMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  reviewMode === 'single'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                سؤال بسؤال
              </button>
              <button
                onClick={() => setReviewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  reviewMode === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                عرض كافة الأسئلة (50)
              </button>
            </div>
          </div>

          {/* Review Section */}
          <div className="space-y-6 text-right">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>مراجعة الإجابات التفصيلية (وضع القراءة فقط)</span>
              </h2>
              <span className="text-xs text-slate-400">
                لا يمكن تعديل الإجابات بعد التسليم
              </span>
            </div>

            {/* Mode A: Single Question Navigator */}
            {reviewMode === 'single' && currentQ && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                  <div className="text-sm font-bold text-amber-400">
                    السؤال رقم {currentQ.question_number} من 50
                  </div>
                  <div>
                    {currentQ.is_correct && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        إجابة صحيحة (+1)
                      </span>
                    )}
                    {!currentQ.is_correct && !currentQ.is_unanswered && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-3 py-1 rounded-lg">
                        <XCircle className="w-3.5 h-3.5" />
                        إجابة خاطئة (0)
                      </span>
                    )}
                    {currentQ.is_unanswered && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
                        <HelpCircle className="w-3.5 h-3.5" />
                        لم تتم الإجابة (0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="text-lg font-semibold text-white mb-6 leading-relaxed">
                  {currentQ.question_text}
                </div>

                {/* Options display with correct and student markers */}
                <div className="space-y-3 mb-8">
                  {currentQ.options.map(opt => {
                    const isStudentPick = currentQ.student_option === opt.key;
                    const isCorrectOpt = currentQ.correct_option === opt.key;

                    let cardClass = 'bg-slate-950/60 border-slate-800 text-slate-300';
                    let badgeClass = 'bg-slate-800 text-slate-300';

                    if (isCorrectOpt) {
                      cardClass = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200';
                      badgeClass = 'bg-emerald-500 text-slate-950 font-black';
                    } else if (isStudentPick && !isCorrectOpt) {
                      cardClass = 'bg-red-950/40 border-red-500/50 text-red-200';
                      badgeClass = 'bg-red-500 text-white font-black';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-4 rounded-2xl border flex items-start gap-4 ${cardClass}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${badgeClass}`}>
                          {opt.key}
                        </div>
                        <div className="flex-1 font-medium text-sm sm:text-base leading-snug">
                          {opt.text}
                        </div>
                        <div className="text-xs font-semibold shrink-0">
                          {isCorrectOpt && <span className="text-emerald-400">✓ الإجابة الصحيحة</span>}
                          {isStudentPick && !isCorrectOpt && <span className="text-red-400">✗ إجابتك</span>}
                          {isStudentPick && isCorrectOpt && <span className="text-emerald-400"> (إجابتك)</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Single Navigator buttons */}
                <div className="no-print flex items-center justify-between pt-6 border-t border-slate-800">
                  <button
                    onClick={() => setReviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={reviewIndex === 0}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السؤال السابق</span>
                  </button>

                  {/* Fast question jump palette */}
                  <div className="text-xs text-slate-400">
                    سؤال {reviewIndex + 1} من {questionsReview.length}
                  </div>

                  <button
                    onClick={() => setReviewIndex(prev => Math.min(questionsReview.length - 1, prev + 1))}
                    disabled={reviewIndex === questionsReview.length - 1}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>السؤال التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Mode B: All 50 Questions View (also used for PDF export capture) */}
            {reviewMode === 'all' && (
              <div className="space-y-4">
                {questionsReview.map((q) => (
                  <div
                    key={q.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right page-break-inside-avoid"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <div className="text-xs font-bold text-amber-400">
                        السؤال {q.question_number} من 50
                      </div>
                      <div className="text-xs font-bold">
                        {q.is_correct && <span className="text-emerald-400">✓ إجابة صحيحة (+1)</span>}
                        {!q.is_correct && !q.is_unanswered && <span className="text-red-400">✗ إجابة خاطئة (0)</span>}
                        {q.is_unanswered && <span className="text-slate-400">— لم تتم الإجابة</span>}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-white mb-3">
                      {q.question_text}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map(opt => {
                        const isStudent = q.student_option === opt.key;
                        const isCorrect = q.correct_option === opt.key;

                        let style = 'bg-slate-950/70 border-slate-800 text-slate-300';
                        if (isCorrect) style = 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200 font-bold';
                        else if (isStudent) style = 'bg-red-950/50 border-red-500/40 text-red-200 line-through';

                        return (
                          <div key={opt.key} className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}>
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-center font-bold inline-block shrink-0 leading-5">
                              {opt.key}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && <span className="text-emerald-400 text-[10px]">الصحيحة</span>}
                            {isStudent && !isCorrect && <span className="text-red-400 text-[10px]">إجابتك</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Home Return Button (no-print) */}
        <div className="no-print text-center pt-4">
          <button
            onClick={onReturnHome}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
