import React from 'react';
import { Clock, CheckCircle, XCircle, ShieldAlert, ArrowLeft, RefreshCw, User, Hash, Calendar } from 'lucide-react';
import { AccessRequest } from '../types';

interface StudentWaitingProps {
  request: AccessRequest;
  onProceedToInstructions: () => void;
  onRefreshStatus: () => void;
  isChecking: boolean;
  onCancelRequest: () => void;
}

export const StudentWaiting: React.FC<StudentWaitingProps> = ({
  request,
  onProceedToInstructions,
  onRefreshStatus,
  isChecking,
  onCancelRequest
}) => {
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';
  const isPending = request.status === 'pending';
  const isRevoked = request.status === 'revoked';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-right">
        {/* Academy Emblem Header */}
        <div className="flex items-center justify-center gap-3 mb-6 pb-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-white/20 flex items-center justify-center shrink-0">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-white">الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري</div>
            <div className="text-[10px] text-amber-400 font-medium">جامعة الدول العربية — بوابة انتظار الطالب</div>
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {isPending && (
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
            </div>
          )}
          {isApproved && (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>
          )}
          {(isRejected || isRevoked) && (
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-400">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Heading & Subtitle */}
        {isPending && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              تم إرسال طلب الدخول بنجاح
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              يرجى الانتظار حتى يراجع المدرس طلبك ويوافق على دخول الامتحان.
            </p>
          </div>
        )}

        {isApproved && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-3">
              تمت موافقة المدرس على دخولك
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              أهلاً بك! تم اعتماد دخولك للامتحان، يمكنك الآن الانتقال لقراءة التعليمات وبدء الامتحان.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-red-400 mb-3">
              تم رفض طلب الدخول
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              عذراً، لم يوافق المدرس على طلب الدخول الحالي. يرجى التواصل مع مدرس المادة.
            </p>
          </div>
        )}

        {isRevoked && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-red-400 mb-3">
              تم إلغاء الترخيص بالدخول
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              تم إلغاء الإذن من قبل المدرس. لا يمكنك بدء الامتحان.
            </p>
          </div>
        )}

        {/* Request Details Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 mb-8 space-y-3.5">
          <div className="flex items-center justify-between text-sm py-1 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              اسم الطالب
            </span>
            <span className="font-bold text-white text-base">{request.student_name}</span>
          </div>

          <div className="flex items-center justify-between text-sm py-1 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-slate-500" />
              رقم الطلب
            </span>
            <span className="font-mono text-amber-400 font-semibold">{request.id}</span>
          </div>

          <div className="flex items-center justify-between text-sm py-1 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              وقت الإرسال
            </span>
            <span className="text-slate-300 text-xs">
              {new Date(request.requested_at).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-slate-400">حالة الطلب الحالية</span>
            <div>
              {isPending && (
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  في انتظار موافقة المدرس
                </span>
              )}
              {isApproved && (
                <span className="text-emerald-400 font-bold text-sm">
                  موافق عليه
                </span>
              )}
              {isRejected && (
                <span className="text-red-400 font-bold text-sm">
                  مرفوض
                </span>
              )}
              {isRevoked && (
                <span className="text-red-400 font-bold text-sm">
                  ملغي
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isApproved && (
          <button
            onClick={onProceedToInstructions}
            className="w-full py-4 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <span>بدء الامتحان والانتقال للتعليمات</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {isPending && (
          <div className="space-y-3">
            <button
              onClick={onRefreshStatus}
              disabled={isChecking}
              className="w-full py-3 px-5 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isChecking ? 'جارٍ التحقق...' : 'تحديث الحالة الآن'}</span>
            </button>
            <p className="text-center text-xs text-slate-400">
              * يتم تحديث الصفحة تلقائياً فور اتخاذ المدرس القرار دون الحاجة لإعادة التحميل.
            </p>
          </div>
        )}

        {(isRejected || isRevoked) && (
          <button
            onClick={onCancelRequest}
            className="w-full py-3 px-5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        )}

        {/* Switch Student for shared lab devices / duplicated tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onCancelRequest}
            className="text-xs text-slate-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
          >
            لست الطالب ({request.student_name})؟ اضغط هنا لبدء طلب جديد باسمك
          </button>
        </div>
      </div>
    </div>
  );
};
