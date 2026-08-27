import { useState, useEffect } from 'react';
import { Pill, BellRing, Activity, FileText, CheckCircle2, Clock, AlertCircle, Flame, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getMedicines } from '../services/medicineApi';
import { getUpcomingReminders } from '../services/reminderApi';
import { getTodayMedicationLogs } from '../services/medicationLogApi';
import { getWeeklyAdherence } from '../services/analyticsApi';
import DailyMedicationSchedule from '../components/medicine/DailyMedicationSchedule';

// Mock Data for Health Overview chart (Health records implemented in future steps)
const healthData = [
  { name: 'Mon', weight: 70, bp: 120 },
  { name: 'Tue', weight: 70.2, bp: 118 },
  { name: 'Wed', weight: 70.1, bp: 122 },
  { name: 'Thu', weight: 69.8, bp: 119 },
  { name: 'Fri', weight: 69.5, bp: 121 },
  { name: 'Sat', weight: 69.4, bp: 118 },
  { name: 'Sun', weight: 69.3, bp: 120 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState(null);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [adherenceData, setAdherenceData] = useState(null);
  const [todayLogStats, setTodayLogStats] = useState({
    total: 0,
    taken: 0,
    pending: 0,
    missed: 0,
    skipped: 0,
    completionRate: 0,
  });

  useEffect(() => {
    let isMounted = true;

    // Fetch active medications count
    getMedicines({ status: 'active', limit: 50 })
      .then((res) => {
        if (isMounted && res?.data?.medicines) {
          setActiveCount(res.data.medicines.length);
        }
      })
      .catch(() => {});

    // Fetch next 24-hour upcoming medication reminders from Reminder Engine
    getUpcomingReminders(24)
      .then((res) => {
        if (isMounted && res?.data?.reminders) {
          setUpcomingReminders(res.data.reminders);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingUpcoming(false);
      });

    // Fetch today's dose tracking statistics
    getTodayMedicationLogs()
      .then((res) => {
        if (isMounted && res?.data?.stats) {
          setTodayLogStats(res.data.stats);
        }
      })
      .catch(() => {});

    // Fetch 7-day medication adherence summary
    getWeeklyAdherence()
      .then((res) => {
        if (isMounted && res?.data) {
          setAdherenceData(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here's your medication adherence and reminder overview for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Medications" 
          value={activeCount !== null ? String(activeCount) : '0'} 
          icon={Pill}
          trend={{ value: 'Active', label: 'prescriptions', isPositive: true }}
        />
        <StatCard 
          title="Today's Doses Taken" 
          value={`${todayLogStats.taken} / ${todayLogStats.total}`} 
          icon={Activity}
          trend={{
            value: `${todayLogStats.completionRate}%`,
            label: `${todayLogStats.pending} pending`,
            isPositive: todayLogStats.completionRate > 50,
          }}
        />
        <StatCard 
          title="Upcoming Reminders" 
          value={loadingUpcoming ? '...' : String(upcomingReminders.length)} 
          icon={BellRing}
          trend={{ value: `${upcomingReminders.length} scheduled`, label: 'next 24h', isPositive: true }}
        />
        <StatCard 
          title="Health Records" 
          value="24" 
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Medication Schedule Widget */}
          <DailyMedicationSchedule />

          {/* Health Overview Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Health Trends</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={['dataMin - 2', 'dataMax + 2']} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-6">
          {/* Medication Adherence Card */}
          <Card className="p-6 bg-gradient-to-br from-teal-900 via-primary to-primary-light text-white shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold">Medication Adherence</h2>
              <Link to="/adherence" className="text-xs text-teal-200 hover:underline flex items-center gap-1">
                View Trends →
              </Link>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold tracking-tight">
                    {adherenceData?.hasData ? `${adherenceData.adherenceScore}%` : 'No Data'}
                  </p>
                  {adherenceData?.hasData && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white">
                      {adherenceData.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-100/90 mt-1">
                  {adherenceData?.hasData
                    ? `${adherenceData.taken} / ${adherenceData.totalEligible} doses taken`
                    : 'No past evaluated doses'}
                </p>
                {adherenceData && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                    <Flame size={14} className="text-amber-300 shrink-0" />
                    <span>
                      Current streak: {adherenceData.currentStreak}{' '}
                      {adherenceData.currentStreak === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-16 w-16 relative shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="white"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="175"
                    strokeDashoffset={
                      175 - (175 * (adherenceData?.hasData ? adherenceData.adherenceScore : 0)) / 100
                    }
                  />
                </svg>
              </div>
            </div>
          </Card>

          {/* Upcoming Reminders (Live Next 24 Hours) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Next 24 Hours</h2>
              <Link to="/reminders" className="text-xs font-semibold text-secondary hover:underline">
                View All
              </Link>
            </div>

            {loadingUpcoming ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse h-12 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No medication reminders scheduled for the next 24 hours.
              </p>
            ) : (
              <div className="relative border-l border-slate-200 ml-3 space-y-5">
                {upcomingReminders.slice(0, 5).map((reminder) => {
                  const med = reminder.relatedMedicine || {};
                  const timeFormatted = reminder.scheduledFor
                    ? new Date(reminder.scheduledFor).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--';
                  return (
                    <div key={reminder._id} className="relative pl-5">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white bg-primary" />
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {med.name || reminder.title}
                          </p>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {timeFormatted}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {med.dosage ? `${med.dosage} ${med.dosageUnit || ''}` : reminder.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Access to Live Tracker */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Medication Tracker</h2>
            <p className="text-xs text-slate-500 mb-4">
              Mark doses as taken, record skips, and view real-time adherence progress.
            </p>
            <Link to="/tracker" className="block">
              <button
                type="button"
                className="w-full py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                Open Daily Checklist
              </button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
