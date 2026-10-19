import React, { useState } from 'react';
import { Anchor, ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import customsPortImage from '../assets/images/egyptian_customs_port_1792320667818.jpg';
import { clearStudentSession } from '../api';

interface StudentLandingProps {
  onSubmitName: (name: string) => Promise<void>;
  onOpenInstructorLogin: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const StudentLanding: React.FC<StudentLandingProps> = ({
  onSubmitName,
  onOpenInstructorLogin,
  isLoading,
  errorMessage
}) => {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError('يرجى إدخال اسمك الكامل للمتابعة');
      return;
    }
    if (trimmed.length < 3) {
      setLocalError('الاسم الكامل يجب أن يتكون من 3 أحرف على الأقل');
      return;
    }
    // Fully reset any stale student data from previous user of this tab/device
    clearStudentSession();
    onSubmitName(trimmed);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* Background with Maritime Theme and Measured Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={customsPortImage}
          alt="Egyptian Commercial Port Terminal"
          className="w-full h-full object-cover object-center filter brightness-90"
          referrerPolicy="no-referrer"
        />
        {/* Deep navy and dark gradient overlay for optimal Arabic legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/60" />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-white tracking-wide">
              الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري
            </div>
            <div className="text-xs text-amber-400 font-medium">
              جامعة الدول العربية — اختبار الإجراءات الجمركية
            </div>
          </div>
        </div>

        {/* Discreet Instructor Link */}
        <button
          onClick={onOpenInstructorLogin}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/90 border border-white/10 transition-colors cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>دخول المدرس</span>
        </button>
      </header>

      {/* Hero Content Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center text-center">
        {/* Prominent Official Emblem */}
        <div className="mb-5 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2.5 shadow-2xl border-2 border-amber-400/40 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Subtle pill-free kicker */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري — منظومة التقييم الإلكتروني</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight sm:leading-snug max-w-3xl mb-4">
          اختبار الإجراءات الجمركية
        </h1>

        {/* Official Introduction Text */}
        <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl mb-8 font-normal">
          تقييم المعرفة بالقوانين والتشريعات المنظمة للاستيراد والتصدير وقانون الجمارك رقم 207 لسنة 2020، تحت إشراف الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري.
        </p>

        {/* Student Name Card */}
        <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/15 p-6 sm:p-8 shadow-2xl text-right">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="studentName" className="block text-sm font-semibold text-slate-200 mb-2">
                الاسم الكامل للطالب
              </label>
              <input
                id="studentName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                disabled={isLoading}
                dir="rtl"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-base disabled:opacity-60"
              />
              <p className="text-xs text-slate-400 mt-2">
                * يرجى إدخال اسمك الحقيقي ثلاثياً أو رباعياً كما سيظهر في النتيجة المعتمدة.
              </p>
            </div>

            {(localError || errorMessage) && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs text-right">
                {localError || errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <span>طلب دخول الامتحان</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-10 text-right">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">50 سؤال اختيار من متعدد</div>
              <div className="text-xs text-slate-400">تغطي كامل الإجراءات والقوانين</div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">مدة الامتحان 60 دقيقة</div>
              <div className="text-xs text-slate-400">توقيت إلكتروني موحد ودقيق</div>
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">تصحيح فوري وتقرير PDF</div>
              <div className="text-xs text-slate-400">مراجعة كاملة للإجابات فور التسليم</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center border-t border-white/10 text-xs text-slate-400">
        <div>
          جميع الحقوق محفوظة © بنك أسئلة الإجراءات الجمركية — جمهورية مصر العربية
        </div>
      </footer>
    </div>
  );
};
