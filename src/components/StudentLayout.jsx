import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { 
  Home, CreditCard, Award, BookOpen, Calendar, 
  MessageSquare, BookMarked, LogOut, Menu, X, Users, ChevronDown
} from 'lucide-react';

const StudentLayout = () => {
  const { user, isStudent, isParent, activeWard, setActiveWard, logout } = useAuth();
  const { school, activeSession, activeTerm } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wardDropdown, setWardDropdown] = useState(false);

  // If not logged in as student or parent, redirect to pupil/parent login form
  if (!user || (!isStudent && !isParent)) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { label: 'Portal Home', path: '/students', icon: Home, exact: true },
    { label: 'School Fees & Paystack', path: '/students/fees', icon: CreditCard },
    { label: 'Term Results & PIN', path: '/students/results', icon: Award },
    { label: 'CBT Online Exams', path: '/students/exams', icon: BookMarked },
    { label: 'Class Timetable', path: '/students/timetable', icon: Calendar },
    { label: 'Lesson Notes & E-Learning', path: '/students/elearning', icon: BookOpen },
    { label: 'School Communications', path: '/students/communications', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-navy text-white transition-transform duration-200 transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Brand header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-amber text-brand-navy flex items-center justify-center font-black text-xl shadow-lg shadow-brand-amber/30">
              F
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider uppercase text-white">Faith Spring School</div>
              <div className="text-[11px] text-amber-300 font-semibold tracking-wide">
                {isParent ? 'Parent Portal' : 'Student Portal'}
              </div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Parent Child Switcher if parent has multiple wards */}
        {isParent && user?.wards?.length > 0 && (
          <div className="p-3 mx-3 mt-3 bg-white/5 rounded-xl border border-white/10 relative">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Viewing Child:</span>
              <Users size={12} />
            </div>
            <button
              onClick={() => setWardDropdown(!wardDropdown)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-white bg-brand-navy/60 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-amber-400/50 transition-colors"
            >
              <div className="truncate">
                <div>{activeWard?.name || 'Selected Ward'}</div>
                <div className="text-[10px] text-slate-400">{activeWard?.class_name} • {activeWard?.admission_number}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400 ml-1 flex-shrink-0" />
            </button>

            {wardDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/15 rounded-lg shadow-2xl p-1 z-50">
                {user.wards.map(ward => (
                  <button
                    key={ward.id}
                    onClick={() => {
                      setActiveWard(ward);
                      setWardDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded text-xs transition-colors ${
                      activeWard?.id === ward.id ? 'bg-brand-blue text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>{ward.name}</div>
                    <div className="text-[10px] opacity-75">{ward.class_name} ({ward.admission_number})</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-amber text-brand-navy shadow-md shadow-brand-amber/30 font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-navy' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Account Summary & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center text-sm">
              {user?.full_name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.full_name || 'Parent / Student'}</p>
              <p className="text-xs text-amber-300 truncate">{isParent ? 'Guardian' : user?.admission_number}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-medium transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-800">Pupil & Family Portal</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-brand-blue font-bold">{activeWard?.name || user?.full_name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
              {activeSession.name} • {activeTerm.name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
