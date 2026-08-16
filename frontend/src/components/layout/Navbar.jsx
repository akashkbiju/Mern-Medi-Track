import { Link } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';

const Navbar = () => {
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
        
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={18} />
          </div>
          <span className="text-sm font-medium text-slate-700">John Doe</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
