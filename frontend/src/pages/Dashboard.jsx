import { useState, useEffect } from 'react';
import {
  Pill,
  BellRing,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flame,
  TrendingUp,
  HeartPulse,
  Sparkles,
  Bell,
  Stethoscope,
  Download,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getPatientDashboard } from '../services/dashboardApi';
import { getHealthAnalytics } from '../services/analyticsApi';
import { downloadReportPdf } from '../services/reportApi';
import DailyMedicationSchedule from '../components/medicine/DailyMedicationSchedule';

const Dashboard = () => {
  const { user } = useAuth();
  const { recentNotifications, markAsRead } = useNotifications();

  const [dashboardData, setDashboardData] = useState(null);
  const [weightTrend, setWeightTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [dashRes, trendRes] = await Promise.all([
          getPatientDashboard().catch(() => ({ data: null })),
          getHealthAnalytics({ metric: 'weight', period: '7d' }).catch(() => ({ data: { trend: [] } })),
        ]);

        if (isMounted) {
          if (dashRes?.data) {
            setDashboardData(dashRes.data);
          }
          if (trendRes?.data?.trend) {
            setWeightTrend(trendRes.data.trend);
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadLatestPdf = async (reportId, e) => {
    if (e) e.stopPropagation();
    setDownloadingReportId(reportId);
    try {
      const blob = await downloadReportPdf(reportId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MediTrack-Report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'PDF report downloaded successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to download report PDF.' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setDownloadingReportId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  const med = dashboardData?.medication || {};
  const todayStats = med.today || { total: 0, taken: 0, missed: 0, pending: 0, skipped: 0, completionRate: 0 };
  const adherence = med.adherence || { hasData: false, adherenceScore: 0, category: 'No Data', currentStreak: 0, taken: 0, totalEligible: 0 };
  const vitals = dashboardData?.health?.vitals || {};
  const doc = dashboardData?.doctor || { connectedDoctors: [], pendingRequestsCount: 0, recentRecommendations: [] };
  const latestReport = dashboardData?.reports?.latestReport;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive overview of your medication adherence, vital telemetry, and physician care.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/medicines" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            title="Active Medications"
            value={loading ? '...' : String(med.activeCount ?? 0)}
            icon={Pill}
            trend={{ value: 'Manage', label: 'prescriptions →', isPositive: true }}
          />
        </Link>
        <Link to="/tracker" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            title="Today's Doses Taken"
            value={loading ? '...' : `${todayStats.taken} / ${todayStats.total}`}
            icon={Activity}
            trend={{
              value: `${todayStats.completionRate}%`,
              label: `${todayStats.pending} pending`,
              isPositive: todayStats.completionRate >= 50,
            }}
          />
        </Link>
        <Link to="/adherence" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            title="7-Day Adherence"
            value={loading ? '...' : adherence.hasData ? `${adherence.adherenceScore}%` : 'No Data'}
            icon={Flame}
            trend={{
              value: adherence.category || 'General',
              label: adherence.currentStreak > 0 ? `${adherence.currentStreak}d streak` : 'tracking',
              isPositive: (adherence.adherenceScore || 0) >= 80,
            }}
          />
        </Link>
        <Link to="/my-doctors" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            title="Connected Doctors"
            value={loading ? '...' : String(doc.connectedDoctors?.length || 0)}
            icon={Stethoscope}
            trend={{
              value: doc.pendingRequestsCount > 0 ? `${doc.pendingRequestsCount} Pending` : 'Active Roster',
              label: '→',
              isPositive: true,
            }}
          />
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Medication Schedule Widget */}
          <DailyMedicationSchedule />

          {/* Vitals Telemetry & Trend Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Health Vitals & Trends</h2>
                <p className="text-xs text-slate-500">Latest recorded biometrics and 7-day longitudinal trend</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/health"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  + Log Vitals
                </Link>
                <Link
                  to="/health-analytics"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-0.5"
                >
                  Analytics →
                </Link>
              </div>
            </div>

            {/* Vitals Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Blood Pressure
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {vitals.bloodPressure || '--'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Blood Sugar
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {vitals.bloodSugar || '--'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Heart Rate
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {vitals.heartRate || '--'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Weight
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {vitals.weight || '--'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Temperature
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {vitals.temperature || '--'}
                </span>
              </div>
            </div>

            {/* Weight Trend Chart */}
            {weightTrend.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => (val ? val.slice(5) : '')}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      domain={['auto', 'auto']}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val} kg`, 'Weight']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-center px-4">
                <HeartPulse className="h-5 w-5 text-slate-400 mb-1" />
                <p className="text-xs font-semibold text-slate-700">No recent vitals logged</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record daily vitals to generate longitudinal trends and health alerts.
                </p>
              </div>
            )}
          </Card>

          {/* Connected Physicians & Recommendations Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Physician Care & Recommendations</h3>
                  <p className="text-xs text-slate-500">Active guidance shared by your approved healthcare team</p>
                </div>
              </div>
              <Link
                to="/doctor-recommendations"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                All Recommendations →
              </Link>
            </div>

            {/* Recommendations List */}
            {doc.recentRecommendations && doc.recentRecommendations.length > 0 ? (
              <div className="space-y-3">
                {doc.recentRecommendations.slice(0, 3).map((rec) => {
                  const isUrgent = rec.priority === 'urgent';
                  const isImportant = rec.priority === 'important';

                  return (
                    <div
                      key={rec._id}
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 transition ${
                        isUrgent
                          ? 'bg-rose-50/70 border-rose-200'
                          : isImportant
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{rec.title}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-800'
                                : isImportant
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200/70 text-slate-700'
                            }`}
                          >
                            {rec.priority}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {rec.doctor?.fullName ? `Dr. ${rec.doctor.fullName}` : 'Physician'}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{rec.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p>No active doctor recommendations at this time.</p>
                <Link
                  to="/doctor-directory"
                  className="inline-block mt-2 text-xs font-semibold text-teal-600 hover:underline"
                >
                  Find and connect with an approved physician →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Adherence Card */}
          <Card className="p-6 bg-gradient-to-br from-slate-900 via-primary to-teal-950 text-white shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-300">Adherence Telemetry</h2>
              <Link to="/adherence" className="text-xs text-teal-200 hover:underline">
                View Trends →
              </Link>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black tracking-tight">
                    {adherence.hasData ? `${adherence.adherenceScore}%` : 'No Data'}
                  </p>
                  {adherence.hasData && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white">
                      {adherence.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-100/90 mt-1">
                  {adherence.hasData
                    ? `${adherence.taken} of ${adherence.totalEligible} doses taken`
                    : 'No past evaluated doses'}
                </p>
                {adherence.currentStreak > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                    <Flame size={14} className="text-amber-300 shrink-0" />
                    <span>
                      {adherence.currentStreak} day streak
                    </span>
                  </div>
                )}
              </div>
              <div className="h-14 w-14 relative shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="none" />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="#14b8a6"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="150"
                    strokeDashoffset={150 - (150 * (adherence.hasData ? adherence.adherenceScore : 0)) / 100}
                  />
                </svg>
              </div>
            </div>
          </Card>

          {/* Latest Health Report Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Latest Health Report</h3>
              </div>
              <Link to="/reports" className="text-xs font-semibold text-teal-600 hover:underline">
                All Reports →
              </Link>
            </div>

            {latestReport ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                    {latestReport.reportType}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(latestReport.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 leading-relaxed">
                  {latestReport.summary || 'Longitudinal telemetry compilation.'}
                </p>
                {latestReport.adherenceScore !== null && latestReport.adherenceScore !== undefined && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span>Period Adherence Score</span>
                    <span>{latestReport.adherenceScore}%</span>
                  </div>
                )}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => handleDownloadLatestPdf(latestReport._id, e)}
                    disabled={downloadingReportId === latestReport._id}
                    className="w-full py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {downloadingReportId === latestReport._id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Downloading PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 space-y-2">
                <p>No reports generated yet.</p>
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="text-xs font-semibold py-1 px-3">
                    Generate First Report
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Upcoming Reminders (Next 24h) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Upcoming Reminders</h2>
              <Link to="/reminders" className="text-xs font-semibold text-teal-600 hover:underline">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse h-10 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : med.upcomingReminders && med.upcomingReminders.length > 0 ? (
              <div className="relative border-l border-slate-200 ml-2.5 space-y-4">
                {med.upcomingReminders.slice(0, 4).map((reminder) => {
                  const timeFormatted = reminder.scheduledFor
                    ? new Date(reminder.scheduledFor).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--';
                  return (
                    <div key={reminder._id} className="relative pl-4">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white bg-teal-600" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 truncate">
                          {reminder.relatedMedicine?.name || reminder.title}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {timeFormatted}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {reminder.relatedMedicine?.dosage
                          ? `${reminder.relatedMedicine.dosage} ${reminder.relatedMedicine.dosageUnit || ''}`
                          : reminder.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                No reminders scheduled in next 24 hours.
              </p>
            )}
          </Card>

          {/* Recent Notifications Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              </div>
              <Link to="/notifications" className="text-xs font-semibold text-teal-600 hover:underline">
                View All →
              </Link>
            </div>

            {recentNotifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No new notifications. You're completely up to date!
              </p>
            ) : (
              <div className="space-y-2">
                {recentNotifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => markAsRead(notif._id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      notif.isRead
                        ? 'bg-slate-50 border-slate-100 text-slate-700'
                        : 'bg-teal-50/40 border-teal-200/80 text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-500 line-clamp-1 leading-snug">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
