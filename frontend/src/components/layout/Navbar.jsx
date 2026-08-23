import { Link } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();

  // Avatar initials helper
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-slate-400" />
          </span>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-slate-50"
            placeholder="Search..."
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="text-slate-500 hover:text-slate-700 relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        <Link 
          to="/profile" 
          className="flex items-center space-x-2 border-l border-slate-200 pl-4 group hover:opacity-90 transition-opacity"
          title="View & Edit Profile"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
            {user?.fullName ? getInitials(user.fullName) : <User size={18} />}
          </div>
          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
            {user?.fullName || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
