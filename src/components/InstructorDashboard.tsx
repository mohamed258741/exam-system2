import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  Award,
  FileSpreadsheet,
  FileText,
  Download,
  RotateCcw,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  KeyRound,
  Shield,
  Eye,
  Clock,
  ArrowUpDown,
  History,
  AlertCircle,
  Trash2,
  Printer
} from 'lucide-react';
import {
  AccessRequest,
  DashboardStats,
  ExamAttempt,
  MonitoringItem,
  QuestionReviewItem,
  AuditLog
} from '../types';
import {
  fetchInstructorStats,
  fetchInstructorRequests,
  actionAccessRequest,
  fetchMonitoringData,
  fetchAllAttempts,
  fetchAttemptDetails,
  resetStudentAttempt,
  deleteStudentAttempt,
  authorizeAdditionalAttempt,
  fetchAuditLogs,
  fetchConsolidatedReport,
  changeInstructorPassword,
  setInstructorToken
} from '../api';
import { exportAttemptsToExcel, exportAttemptsToCsv } from '../utils/exportUtils';
import {
  downloadFormalStudentPdf,
  downloadFormalConsolidatedPdf,
  openFormalPrintWindow,
  openConsolidatedPrintWindow
} from '../utils/formalPdfReport';

interface InstructorDashboardProps {
  onLogout: () => void;
}

type TabType = 'overview' | 'requests' | 'live_monitoring' | 'students' | 'results' | 'audit';

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringItem[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'score' | 'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<{
    attempt: ExamAttempt;
    questionsReview: QuestionReviewItem[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, reqsRes, monRes, attsRes, logsRes] = await Promise.all([
        fetchInstructorStats(),
        fetchInstructorRequests(),
        fetchMonitoringData(),
        fetchAllAttempts(),
        fetchAuditLogs()
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (reqsRes.success && reqsRes.requests) setRequests(reqsRes.requests);
      if (monRes.success && monRes.monitoring) setMonitoring(monRes.monitoring);
      if (attsRes.success && attsRes.attempts) setAttempts(attsRes.attempts);
      if (logsRes.success && logsRes.logs) setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup real-time updates via SSE + 4s polling fallback
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (['new_request', 'request_updated', 'exam_started', 'exam_completed', 'attempt_reset', 'attempt_authorized'].includes(parsed.type)) {
            loadData();
          }
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      // SSE fallback
    }

    const pollingInterval = setInterval(() => {
      loadData();
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollingInterval);
    };
  }, []);

  // Request actions
  const handleApprove = async (id: string) => {
    const res = await actionAccessRequest(id, 'approved');
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'فشل قبول الطلب');
    }
  };

  const handleReject = async (id: string) => {
    const res = await actionAccessRequest(id, 'rejected');
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'فشل رفض الطلب');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء الإذن بالدخول؟')) return;
    const res = await actionAccessRequest(id, 'revoked');
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'فشل إلغاء الإذن');
    }
  };

  const handleResetAttempt = async (attemptId: string) => {
    const reason = prompt('أدخل سبب إعادة التعيين (سيتم توثيقه في سجل التدقيق):', 'إعادة تعيين بتوجيه من مدرس المادة');
    if (reason === null) return;
    const res = await resetStudentAttempt(attemptId, reason);
    if (res.success) {
      loadData();
      alert('تمت إعادة تعيين محاولة الطالب بنجاح');
    } else {
      alert(res.error || 'فشلت إعادة التعيين');
    }
  };

  const handleAuthorizeNewAttempt = async (requestId: string) => {
    const reason = prompt('أدخل سبب السماح بمحاولة إضافية:', 'منح فرصة ثانية بتفويض من المدرس');
    if (reason === null) return;
    const res = await authorizeAdditionalAttempt(requestId, reason);
    if (res.success) {
      loadData();
      alert('تم السماح للطالب ببدء محاولة جديدة بنجاح');
    } else {
      alert(res.error || 'فشل الترخيص بمحاولة جديدة');
    }
  };

  const handleDeleteAttempt = async (attemptId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من حذف محاولة الطالب "${studentName}" نهائياً؟\nسيتم مسح جميع الإجابات والدرجة المسجلة فورياً.`)) {
      return;
    }
    const res = await deleteStudentAttempt(attemptId);
    if (res.success) {
      if (selectedAttemptId === attemptId) {
        setSelectedAttemptId(null);
      }
      loadData();
    } else {
      alert(res.error || 'فشل حذف المحاولة');
    }
  };

  const handleViewAttemptDetails = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setIsLoadingDetails(true);
    setAttemptDetails(null);
    try {
      const res = await fetchAttemptDetails(attemptId);
      if (res.success && res.attempt && res.questionsReview) {
        setAttemptDetails({
          attempt: res.attempt,
          questionsReview: res.questionsReview
        });
      } else {
        alert(res.error || 'تعذر جلب تفاصيل المحاولة');
      }
    } catch {
      alert('خطأ في الاتصال');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!currentPass || !newPass) {
      setPassError('يرجى ملء جميع الحقول');
      return;
    }

    const res = await changeInstructorPassword(currentPass, newPass);
    if (res.success) {
      setPassSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } else {
      setPassError(res.error || 'فشل تغيير كلمة المرور');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    exportAttemptsToExcel(attempts, 'customs_exam_results_full.xlsx');
  };

  const handleExportCsv = () => {
    exportAttemptsToCsv(attempts, 'customs_exam_results_full.csv');
  };

  const handleDownloadConsolidatedPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await fetchConsolidatedReport();
      if (res.success && res.students && res.students.length > 0) {
        await downloadFormalConsolidatedPdf(res.students);
      } else {
        alert('لا توجد نتائج مكتملة بعد لتوليد التقرير المجمع');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير التقرير المجمع');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintConsolidated = async () => {
    try {
      const res = await fetchConsolidatedReport();
      if (res.success && res.students && res.students.length > 0) {
        openConsolidatedPrintWindow(res.students);
      } else {
        alert('لا توجد نتائج مكتملة بعد للمعاينة');
      }
    } catch (err) {
      console.error(err);
      alert('خطأ في الاتصال');
    }
  };

  const handleDownloadStudentPdf = async () => {
    if (!attemptDetails) return;
    setIsExportingPdf(true);
    try {
      await downloadFormalStudentPdf(attemptDetails.attempt, attemptDetails.questionsReview);
    } catch (err) {
      console.error(err);
      openFormalPrintWindow(attemptDetails.attempt, attemptDetails.questionsReview);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintStudentResult = () => {
    if (!attemptDetails) return;
    openFormalPrintWindow(attemptDetails.attempt, attemptDetails.questionsReview);
  };

  // Filtered and sorted results for Tab E
  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'expired');
  const filteredCompletedAttempts = completedAttempts
    .filter(a => {
      const matchQuery = !searchQuery || a.student_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchQuery && matchStatus;
    })
    .sort((a, b) => {
      if (sortField === 'score') {
        const diff = (a.score || 0) - (b.score || 0);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortField === 'name') {
        const comp = a.student_name.localeCompare(b.student_name, 'ar');
        return sortOrder === 'asc' ? comp : -comp;
      }
      const diff = new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });

  // Filtered requests for Tab B
  const filteredRequests = requests.filter(r => {
    const matchQuery = !searchQuery || r.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Top Navigation Bar adhering to Universal Frontend Design Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3.5 whitespace-nowrap shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm border border-white/20 flex items-center justify-center shrink-0">
            <img
              src="/aastmt_logo.png"
              alt="شعار الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white">الأكاديمية العربية — لوحة تحكم المدرس</span>
            <div className="text-[10px] text-amber-400 font-medium">جامعة الدول العربية — اختبار الإجراءات الجمركية</div>
          </div>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeTab === 'overview' ? 'text-amber-400 font-bold' : 'hover:text-white'}`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'requests' ? 'text-amber-400 font-bold' : 'hover:text-white'}`}
          >
            <span>طلبات الدخول</span>
            {stats && stats.pendingRequests > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                {stats.pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('live_monitoring'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeTab === 'live_monitoring' ? 'text-amber-400 font-bold' : 'hover:text-white'}`}
          >
            مراقبة الامتحانات
          </button>
          <button
            onClick={() => { setActiveTab('students'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeTab === 'students' ? 'text-amber-400 font-bold' : 'hover:text-white'}`}
          >
            إدارة الطلاب والمحاولات
          </button>
          <button
            onClick={() => { setActiveTab('results'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeTab === 'results' ? 'text-amber-400 font-bold' : 'hover:text-white'}`}
          >
            النتائج النهائية
          </button>
          <button
            onClick={() => { setActiveTab('audit'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeTab === 'audit' ? 'text-amber-400 font-bold' : 'hover:text-white'}`}
          >
            سجل التدقيق
          </button>
        </nav>

        {/* Zone 3: Actions (Password & Logout) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            title="تحديث البيانات"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>تغيير كلمة المرور</span>
          </button>

          <button
            onClick={() => {
              setInstructorToken(null);
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile Navigation Pills */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'overview' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'requests' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}
          >
            الطلبات ({stats?.pendingRequests || 0})
          </button>
          <button
            onClick={() => setActiveTab('live_monitoring')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'live_monitoring' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}
          >
            المراقبة
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'students' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}
          >
            المحاولات
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'results' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}
          >
            النتائج
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'audit' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}
          >
            سجل التدقيق
          </button>
        </div>

        {/* Global Export Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>تقارير وتصدير نتائج الاختبار:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadConsolidatedPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'جارٍ إعداد PDF...' : 'تقرير مجمع PDF'}</span>
            </button>

            <button
              onClick={handlePrintConsolidated}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>معاينة وطباعة رسمية</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير Excel (XLSX)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB A: لوحة التحكم الرئيسية (Overview KPI Cards)
           ======================================================== */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">إجمالي طلبات الدخول</div>
                <div className="text-3xl font-black text-white tabular-nums">{stats.totalRequests}</div>
              </div>

              <div className="bg-slate-900 border border-amber-500/30 bg-amber-500/5 rounded-2xl p-5 text-right">
                <div className="text-xs text-amber-400 mb-1">في انتظار الموافقة</div>
                <div className="text-3xl font-black text-amber-400 tabular-nums">{stats.pendingRequests}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">الطلاب الموافق عليهم</div>
                <div className="text-3xl font-black text-emerald-400 tabular-nums">{stats.approvedRequests}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">الامتحانات الجارية الآن</div>
                <div className="text-3xl font-black text-cyan-400 tabular-nums">{stats.inProgressExams}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">الامتحانات المكتملة</div>
                <div className="text-3xl font-black text-white tabular-nums">{stats.completedExams}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">متوسط الدرجات</div>
                <div className="text-3xl font-black text-amber-400 tabular-nums">
                  {stats.averageScore} <span className="text-xs text-slate-400 font-normal">/ 50</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">أعلى درجة مسجلة</div>
                <div className="text-3xl font-black text-emerald-400 tabular-nums">
                  {stats.topScore} <span className="text-xs text-slate-400 font-normal">/ 50</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-right">
                <div className="text-xs text-slate-400 mb-1">منتهية بانتهاء الوقت</div>
                <div className="text-3xl font-black text-red-400 tabular-nums">{stats.expiredDueToTime}</div>
              </div>
            </div>

            {/* Quick Pending Requests Alert */}
            {stats.pendingRequests > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 flex items-center justify-between text-right">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      يوجد {stats.pendingRequests} طالب في انتظار موافقتك على دخول الامتحان
                    </div>
                    <div className="text-xs text-amber-300/80">
                      اضغط للمعاينة واتخاذ قرار القبول أو الرفض فورياً
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  مراجعة الطلبات الآن
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB B: طلبات دخول الامتحان (Access Requests Table)
           ======================================================== */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-right">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الطالب..."
                  dir="rtl"
                  className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400">الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none"
                >
                  <option value="all">كافة الحالات</option>
                  <option value="pending">في انتظار الموافقة</option>
                  <option value="approved">موافق عليه</option>
                  <option value="rejected">مرفوض</option>
                  <option value="revoked">ملغي</option>
                </select>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="p-4">اسم الطالب</th>
                      <th className="p-4">رقم الطلب</th>
                      <th className="p-4">تاريخ الطلب</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          لا توجد طلبات تطابق معايير البحث
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-white text-sm">{req.student_name}</td>
                          <td className="p-4 font-mono text-slate-400 font-semibold">{req.id}</td>
                          <td className="p-4 text-slate-300">
                            {new Date(req.requested_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </td>
                          <td className="p-4">
                            {req.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                في انتظار الموافقة
                              </span>
                            )}
                            {req.status === 'approved' && (
                              <span className="text-emerald-400 font-bold">موافق عليه</span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="text-red-400 font-bold">مرفوض</span>
                            )}
                            {req.status === 'revoked' && (
                              <span className="text-slate-400 font-bold">ملغي</span>
                            )}
                          </td>
                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(req.id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>موافقة</span>
                                  </button>
                                  <button
                                    onClick={() => handleReject(req.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-950 border border-red-500/40 text-red-300 hover:bg-red-900 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>رفض</span>
                                  </button>
                                </>
                              )}
                              {req.status === 'approved' && (
                                <button
                                  onClick={() => handleRevoke(req.id)}
                                  className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-400 bg-slate-950 border border-slate-800 transition-colors cursor-pointer text-[11px]"
                                >
                                  إلغاء الإذن
                                </button>
                              )}
                              {(req.status === 'rejected' || req.status === 'revoked') && (
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-emerald-400 bg-slate-950 border border-slate-800 transition-colors cursor-pointer text-[11px]"
                                >
                                  إعادة الموافقة
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB C: مراقبة الامتحانات المباشرة (Live Exam Monitoring)
           ======================================================== */}
        {activeTab === 'live_monitoring' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 text-right">
              <div>
                <h3 className="text-sm font-bold text-white">مراقبة الامتحانات المباشرة لجميع الطلاب المعتمدين</h3>
                <p className="text-xs text-slate-400">تحديث فوري لوقت الاختبار، الإجابات، وحالة التسليم</p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {monitoring.length} طالب معتمد
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="p-4">اسم الطالب</th>
                      <th className="p-4">حالة الامتحان</th>
                      <th className="p-4">وقت البدء</th>
                      <th className="p-4">الوقت المتبقي</th>
                      <th className="p-4">الأسئلة المجابة</th>
                      <th className="p-4">غير المجابة</th>
                      <th className="p-4">الدرجة</th>
                      <th className="p-4 text-left">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {monitoring.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          لا يوجد طلاب معتمدون حالياً
                        </td>
                      </tr>
                    ) : (
                      monitoring.map((m) => {
                        const remMin = Math.floor(m.remainingSeconds / 60);
                        const remSec = m.remainingSeconds % 60;

                        return (
                          <tr key={m.requestId} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-bold text-white text-sm">{m.studentName}</td>
                            <td className="p-4">
                              <span
                                className={`font-semibold ${
                                  m.rawStatus === 'active'
                                    ? 'text-cyan-400 font-bold'
                                    : m.rawStatus === 'submitted'
                                    ? 'text-emerald-400'
                                    : m.rawStatus === 'expired'
                                    ? 'text-red-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {m.examStatusLabel}
                              </span>
                            </td>
                            <td className="p-4 text-slate-300">
                              {m.startedAt ? new Date(m.startedAt).toLocaleTimeString('ar-EG') : '—'}
                            </td>
                            <td className="p-4 font-mono font-bold text-amber-400 tabular-nums">
                              {m.rawStatus === 'active' ? (
                                `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-4 font-bold text-emerald-400 tabular-nums">
                              {m.answeredCount} / 50
                            </td>
                            <td className="p-4 text-slate-400 tabular-nums">
                              {m.unansweredCount}
                            </td>
                            <td className="p-4 font-black text-amber-400 tabular-nums text-sm">
                              {m.score !== null ? `${m.score} / 50` : '—'}
                            </td>
                            <td className="p-4 text-left">
                              {m.attemptId && (
                                <button
                                  onClick={() => handleViewAttemptDetails(m.attemptId!)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span>مراجعة الإجابات</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB D: إدارة الطلاب والمحاولات (Student Attempts Management)
           ======================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-right">
              <h3 className="text-sm font-bold text-white mb-1">إدارة المحاولات وصلاحيات إعادة التعيين</h3>
              <p className="text-xs text-slate-400">
                يمكن للمدرس إعادة تعيين محاولة طالب متعثر، أو منح محاولة إضافية مع توثيق السبب في سجل التدقيق.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="p-4">اسم الطالب</th>
                      <th className="p-4">رقم المحاولة</th>
                      <th className="p-4">تاريخ البدء</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">الدرجة</th>
                      <th className="p-4 text-left">إجراءات المدرس</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attempts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          لا توجد محاولات مسجلة حتى الآن
                        </td>
                      </tr>
                    ) : (
                      attempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-white text-sm">{att.student_name}</td>
                          <td className="p-4 font-mono text-slate-300">محاولة #{att.attempt_number}</td>
                          <td className="p-4 text-slate-300">
                            {new Date(att.started_at).toLocaleString('ar-EG')}
                          </td>
                          <td className="p-4">
                            {att.status === 'active' && <span className="text-cyan-400 font-bold">جارٍ الأداء</span>}
                            {att.status === 'submitted' && <span className="text-emerald-400 font-bold">تم التسليم</span>}
                            {att.status === 'expired' && <span className="text-red-400 font-bold">انتهى الوقت</span>}
                            {att.status === 'reset' && <span className="text-slate-400 font-bold">تمت إعادة التعيين</span>}
                          </td>
                          <td className="p-4 font-bold text-amber-400 tabular-nums">
                            {att.score !== undefined ? `${att.score}/50` : '—'}
                          </td>
                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewAttemptDetails(att.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>عرض</span>
                              </button>
                              {att.status !== 'reset' && (
                                <button
                                  onClick={() => handleResetAttempt(att.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 hover:bg-amber-950/40 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>إعادة تعيين</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleAuthorizeNewAttempt(att.access_request_id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40 transition-colors cursor-pointer text-[11px]"
                              >
                                محاولة إضافية
                              </button>
                              <button
                                onClick={() => handleDeleteAttempt(att.id, att.student_name)}
                                className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                title="حذف المحاولة نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB E: النتائج النهائية (Final Results Table)
           ======================================================== */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-right">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الطالب..."
                  dir="rtl"
                  className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-slate-400">الترتيب حسب:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none"
                >
                  <option value="score">الدرجة النهائية</option>
                  <option value="name">اسم الطالب</option>
                  <option value="date">تاريخ الامتحان</option>
                </select>

                <button
                  onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="عكس الترتيب"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="p-4">اسم الطالب</th>
                      <th className="p-4">الدرجة من 50</th>
                      <th className="p-4">النسبة المئوية</th>
                      <th className="p-4">الصحيحة</th>
                      <th className="p-4">الخاطئة</th>
                      <th className="p-4">غير المجابة</th>
                      <th className="p-4">وقت البدء</th>
                      <th className="p-4">وقت التسليم</th>
                      <th className="p-4">حالة الامتحان</th>
                      <th className="p-4 text-left">التقرير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCompletedAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          لا توجد نتائج مكتملة بعد
                        </td>
                      </tr>
                    ) : (
                      filteredCompletedAttempts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-white text-sm">{a.student_name}</td>
                          <td className="p-4 font-black text-amber-400 tabular-nums text-base">
                            {a.score} / 50
                          </td>
                          <td className="p-4 font-bold text-white tabular-nums">
                            {a.percentage}%
                          </td>
                          <td className="p-4 text-emerald-400 font-bold tabular-nums">
                            {a.correct_count}
                          </td>
                          <td className="p-4 text-red-400 font-bold tabular-nums">
                            {a.incorrect_count}
                          </td>
                          <td className="p-4 text-slate-400 tabular-nums">
                            {a.unanswered_count}
                          </td>
                          <td className="p-4 text-slate-300">
                            {new Date(a.started_at).toLocaleTimeString('ar-EG')}
                          </td>
                          <td className="p-4 text-slate-300">
                            {a.submitted_at ? new Date(a.submitted_at).toLocaleTimeString('ar-EG') : '—'}
                          </td>
                          <td className="p-4">
                            {a.status === 'submitted' ? (
                              <span className="text-emerald-400 font-bold">تسليم يدوي</span>
                            ) : (
                              <span className="text-red-400 font-bold">انتهاء الوقت</span>
                            )}
                          </td>
                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewAttemptDetails(a.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-400" />
                                <span>تقرير</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAttempt(a.id, a.student_name)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                title="حذف النتيجة نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB F: سجل التدقيق والعمليات (Audit Logs)
           ======================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-right">
              <h3 className="text-sm font-bold text-white mb-1">سجل تدقيق عمليات المدرس والنظام</h3>
              <p className="text-xs text-slate-400">
                توثيق كامل لكافة قرارات الموافقة، الرفض، إعادة التعيين، وتغييرات كلمة المرور.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا توجد سجلات تدقيق حالياً</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-right text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white mb-0.5">{log.details}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        معرف العملية: {log.id}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: Student Attempt Details & Full Review
         ======================================================== */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col text-right animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <button
                onClick={() => setSelectedAttemptId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {attemptDetails && (
                  <>
                    <button
                      onClick={handleDownloadStudentPdf}
                      disabled={isExportingPdf}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExportingPdf ? 'جارٍ التحميل...' : 'تنزيل PDF رسمي'}</span>
                    </button>

                    <button
                      onClick={handlePrintStudentResult}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>معاينة وطباعة</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAttempt(attemptDetails.attempt.id, attemptDetails.attempt.student_name)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 bg-red-950/60 border border-red-500/40 hover:bg-red-900/60 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>حذف المحاولة</span>
                    </button>
                  </>
                )}
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-sm border border-white/20 flex items-center justify-center shrink-0">
                    <img
                      src="/aastmt_logo.png"
                      alt="شعار الأكاديمية"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    تقرير إجابات الطالب المعتمد
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {isLoadingDetails ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400">جارٍ جلب تفاصيل الإجابات والدرجات...</p>
                </div>
              ) : attemptDetails ? (
                <div className="space-y-4 p-2 bg-slate-900">
                  {/* Student Details Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <div className="text-base font-bold text-white">{attemptDetails.attempt.student_name}</div>
                        <div className="text-xs text-slate-400 font-mono">معرف المحاولة: {attemptDetails.attempt.id}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-black text-amber-400 tabular-nums">
                          {attemptDetails.attempt.score} <span className="text-xs text-slate-400">/ 50</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-400">{attemptDetails.attempt.percentage}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">الصحيحة: </span>
                        <span className="font-bold text-emerald-400">{attemptDetails.attempt.correct_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">الخاطئة: </span>
                        <span className="font-bold text-red-400">{attemptDetails.attempt.incorrect_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">غير المجابة: </span>
                        <span className="font-bold text-slate-400">{attemptDetails.attempt.unanswered_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">الحالة: </span>
                        <span className="font-bold text-white">
                          {attemptDetails.attempt.status === 'submitted' ? 'تسليم يدوي' : 'انتهاء الوقت'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 50 Questions breakdown */}
                  <div className="space-y-3">
                    {attemptDetails.questionsReview.map((q) => (
                      <div
                        key={q.id}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                          <span className="font-bold text-amber-400">السؤال {q.question_number}</span>
                          <span>
                            {q.is_correct && <span className="text-emerald-400 font-bold">✓ إجابة صحيحة (+1)</span>}
                            {!q.is_correct && !q.is_unanswered && <span className="text-red-400 font-bold">✗ إجابة خاطئة (0)</span>}
                            {q.is_unanswered && <span className="text-slate-400">لم تتم الإجابة (0)</span>}
                          </span>
                        </div>

                        <div className="font-semibold text-white mb-2 leading-relaxed">
                          {q.question_text}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400">إجابة الطالب:</span>
                            <span className={`font-bold ${q.is_correct ? 'text-emerald-400' : q.is_unanswered ? 'text-slate-500' : 'text-red-400'}`}>
                              {q.student_option ? `خيار (${q.student_option}) - ${q.student_option_text}` : 'لم يُجب'}
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                            <span className="text-slate-400">الإجابة النموذجية:</span>
                            <span className="font-bold text-emerald-300">
                              خيار ({q.correct_option}) - {q.correct_option_text}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Change Password
         ======================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-white">تغيير كلمة مرور المدرس</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور الحالية</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {passError && (
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs">
                  تم تغيير كلمة المرور بنجاح!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer text-xs"
              >
                حفظ كلمة المرور الجديدة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
