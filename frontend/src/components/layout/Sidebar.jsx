import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  BellRing, 
  Activity, 
  BarChart2, 
  FileText, 
  Stethoscope, 
  Settings, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Medicines', href: '/medicines', icon: Pill },
    { name: 'Reminders', href: '#', icon: BellRing },
    { name: 'Health Tracking', href: '#', icon: Activity },
    { name: 'Analytics', href: '#', icon: BarChart2 },
    { name: 'Health Reports', href: '#', icon: FileText },
    { name: 'Doctors', href: '#', icon: Stethoscope },
  ];

  const secondaryNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '#', icon: Settings },
  ];

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
                      `group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                        isActive
                          ? 'bg-primary-light text-white'
                          : 'text-slate-300 hover:bg-primary-light hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
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
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
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
              <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
