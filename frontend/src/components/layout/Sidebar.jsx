import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  BellRing, 
  Activity, 
  BarChart2, 
  HeartPulse,
  TrendingUp,
  Sparkles,
  Bell,
  FileText, 
  Stethoscope, 
  Settings, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const isDoctor = user?.role === 'doctor';

  const patientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Medicines', href: '/medicines', icon: Pill },
    { name: 'Reminders', href: '/reminders', icon: BellRing },
    { name: 'Dose Tracker', href: '/tracker', icon: Activity },
    { name: 'Adherence', href: '/adherence', icon: BarChart2 },
    { name: 'Health Tracking', href: '/health', icon: HeartPulse },
    { name: 'Health Analytics', href: '/health-analytics', icon: TrendingUp },
    { name: 'Health Insights', href: '/health-insights', icon: Sparkles },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Health Reports', href: '#', icon: FileText },
    { name: 'Doctors', href: '#', icon: Stethoscope },
  ];

  const doctorNavigation = [
    { name: 'Doctor Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Doctor Profile', href: '/doctor/profile', icon: Stethoscope },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
  ];

  const navigation = isDoctor ? doctorNavigation : patientNavigation;

  const patientSecondaryNav = [
    { name: 'Profile & Alerts', href: '/profile', icon: User },
    { name: 'Settings', href: '#', icon: Settings },
  ];

  const doctorSecondaryNav = [
    { name: 'Practice Profile', href: '/doctor/profile', icon: User },
    { name: 'Settings', href: '#', icon: Settings },
  ];

  const secondaryNavigation = isDoctor ? doctorSecondaryNav : patientSecondaryNav;

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-secondary" />
          MediTrack+
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                        isActive && item.href !== '#'
                          ? 'bg-primary-light text-white'
                          : 'text-slate-300 hover:bg-primary-light hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto rounded-full bg-teal-500/20 px-2 py-0.5 text-[11px] font-bold text-teal-300 ring-1 ring-inset ring-teal-500/30">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <div className="text-xs font-semibold leading-6 text-slate-400">Account</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                        isActive && item.href !== '#'
                          ? 'bg-primary-light text-white'
                          : 'text-slate-300 hover:bg-primary-light hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <button
              onClick={logout}
              type="button"
              className="w-full text-left group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
