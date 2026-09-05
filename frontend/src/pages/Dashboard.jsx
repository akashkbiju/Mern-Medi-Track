import { Pill, BellRing, Activity, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data
const healthData = [
  { name: 'Mon', weight: 70, bp: 120 },
  { name: 'Tue', weight: 70.2, bp: 118 },
  { name: 'Wed', weight: 70.1, bp: 122 },
  { name: 'Thu', weight: 69.8, bp: 119 },
  { name: 'Fri', weight: 69.5, bp: 121 },
  { name: 'Sat', weight: 69.4, bp: 118 },
  { name: 'Sun', weight: 69.3, bp: 120 },
];

const todayMedicines = [
  { id: 1, name: 'Vitamin D', dosage: '1 tablet', time: '8:00 AM', status: 'taken' },
  { id: 2, name: 'Medicine B', dosage: '1 tablet', time: '1:00 PM', status: 'pending' },
  { id: 3, name: 'Medicine C', dosage: '1 tablet', time: '8:00 PM', status: 'pending' },
];

const recentActivity = [
  { id: 1, title: 'Medicine marked as taken', time: 'Today, 8:02 AM', type: 'medication' },
  { id: 2, title: 'Weight updated', time: 'Yesterday, 7:30 PM', type: 'health' },
  { id: 3, title: 'Health report generated', time: 'Yesterday, 6:00 PM', type: 'report' },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good Morning, John</h1>
        <p className="mt-1 text-sm text-slate-500">Here's your health overview for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Medicines Today" 
          value="4" 
          icon={Pill}
          trend={{ value: '1 left', label: 'to take', isPositive: true }}
        />
        <StatCard 
          title="Medication Adherence" 
          value="92%" 
          icon={Activity}
          trend={{ value: '+2%', label: 'vs last week', isPositive: true }}
        />
        <StatCard 
          title="Upcoming Reminders" 
          value="3" 
          icon={BellRing}
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
          {/* Health Overview Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Health Overview</h2>
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

          {/* Today's Medication */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Today's Medication</h2>
              <button className="text-sm text-secondary font-medium hover:text-secondary-light">View All</button>
            </div>
            <div className="space-y-4">
              {todayMedicines.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${med.status === 'taken' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      <Pill size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{med.name}</h3>
                      <p className="text-sm text-slate-500">{med.dosage} • {med.time}</p>
                    </div>
                  </div>
                  <div>
                    {med.status === 'taken' ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 size={12} /> Taken
                      </Badge>
                    ) : med.status === 'missed' ? (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertCircle size={12} /> Missed
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Clock size={12} /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-6">
          {/* Adherence Card */}
          <Card className="p-6 bg-gradient-to-br from-primary to-primary-light text-white">
            <h2 className="text-lg font-semibold mb-2">Weekly Adherence</h2>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">92%</p>
                <p className="text-sm text-slate-300 mt-1">Excellent adherence</p>
              </div>
              <div className="h-16 w-16 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                  <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="8" fill="none" strokeDasharray="175" strokeDashoffset="14" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Upcoming Reminders */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Reminders</h2>
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {todayMedicines.map((med, index) => (
                <div key={med.id} className="relative pl-6">
                  <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${med.status === 'taken' ? 'bg-success' : 'bg-warning'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{med.time}</p>
                    <p className="text-sm text-slate-500">{med.name} - {med.dosage}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
