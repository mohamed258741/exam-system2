import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldAlert, KeyRound, Eye, EyeOff, X } from 'lucide-react';
import { instructorLogin } from '../api';

interface InstructorLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const InstructorLogin: React.FC<InstructorLoginProps> = ({
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة مرور المدرس');
      return;
    }

    setIsLoading(true);
    const res = await instructorLogin(password);
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'كلمة المرور غير صحيحة. يرجى التأكد من حالة الأحرف (Case-sensitive).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl border border-white/20 flex items-center justify-center mb-3">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xs text-amber-400 font-bold mb-1">
            الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">تسجيل دخول المدرس</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            منظومة إدارة واعتماد اختبارات الإجراءات الجمركية
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="instructorPass" className="block text-sm font-semibold text-slate-200 mb-2">
              كلمة مرور المدرس
            </label>
            <div className="relative">
              <input
                id="instructorPass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                autoFocus
                disabled={isLoading}
                dir="ltr"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * مطابقة كلمة المرور حساسة لحالة الأحرف الكبيرة والصغيرة.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ التحقق...</span>
                </>
              ) : (
                <>
                  <span>دخول لوحة التحكم</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
