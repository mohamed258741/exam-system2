import React, { useState } from 'react';
import { BookOpen, Check, Play, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { AccessRequest } from '../types';

interface ExamInstructionsProps {
  request: AccessRequest;
  onStartExam: () => Promise<void>;
  isStarting: boolean;
  errorMessage?: string | null;
  onCancelExam?: () => void;
}

export const ExamInstructions: React.FC<ExamInstructionsProps> = ({
  request,
  onStartExam,
  isStarting,
  errorMessage,
  onCancelExam
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  const instructionsList = [
    'يتكون الامتحان من 50 سؤال اختيار من متعدد.',
    'مدة الامتحان 60 دقيقة.',
    'يبدأ احتساب الوقت عند الضغط على زر بدء الامتحان.',
    'لكل سؤال درجة واحدة، والدرجة النهائية 50 درجة.',
    'يمكن الانتقال بين الأسئلة السابقة والتالية أثناء الامتحان.',
    'يمكن تغيير الإجابة أثناء الامتحان ما دام الوقت متاحًا.',
    'يتم حفظ الإجابات تلقائيًا فور اختيارها.',
    'عند تسليم الامتحان، لا يمكن تعديل الإجابات.',
    'عند انتهاء الوقت، يتم تسليم الامتحان تلقائيًا.',
    'بعد التسليم، يمكن مراجعة النتيجة والإجابات في وضع القراءة فقط.'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-right">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-semibold mb-1">
              الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              تعليمات امتحان الإجراءات الجمركية
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              يرجى قراءة الإرشادات التالية بعناية تامة قبل بدء المحاولة المعتمدة
            </p>
          </div>
        </div>

        {/* Student Banner */}
        <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <span className="text-slate-300 text-sm font-medium">اسم الطالب المعتمد:</span>
            <span className="font-bold text-white text-base mr-2">{request.student_name}</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            طلب #{request.request_number}
          </div>
        </div>

        {/* Instructions Points */}
        <div className="space-y-3 mb-8">
          {instructionsList.map((inst, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                {index + 1}
              </div>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {inst}
              </p>
            </div>
          ))}
        </div>

        {/* Acknowledgement Checkbox */}
        <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
          <input
            id="agree-rules"
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="agree-rules" className="text-sm text-slate-300 font-medium cursor-pointer select-none">
            قرأت جميع التعليمات وأوافق على الالتزام بضوابط الامتحان وتوقيت الـ 60 دقيقة.
          </label>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStartExam}
          disabled={!hasAgreed || isStarting}
          className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 text-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <>
              <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>جارٍ بدء الامتحان وحساب الوقت...</span>
            </>
          ) : (
            <>
              <span>بدء الامتحان</span>
              <ArrowLeft className="w-6 h-6" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-4">
          * يبدأ العد التنازلي رسمياً على الخادم بمجرد الضغط على زر بدء الامتحان.
        </p>

        {/* Switch student link */}
        {onCancelExam && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={onCancelExam}
              className="text-xs text-slate-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              لست الطالب ({request.student_name})؟ اضغط هنا لبدء طلب جديد باسمك
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
