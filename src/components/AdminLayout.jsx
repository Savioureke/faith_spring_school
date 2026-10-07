import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { 
  Users, GraduationCap, BookOpen, Layers, CreditCard, 
  Calendar, CheckSquare, Award, BookMarked, MessageSquare, 
  Settings, LogOut, Menu, X, Bell, ChevronRight, School
} from 'lucide-react';
import AdminLoginPage from '../pages/admin/AdminLoginPage';

const AdminLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const { school, activeSession, activeTerm, allTerms, setScopedTerm } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If not logged in as admin, display the dedicated Administrator Login Form
  if (!user || !isAdmin) {
    return <AdminLoginPage />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: School, exact: true },
    { label: 'Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Teachers', path: '/admin/teachers', icon: Users },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Classes', path: '/admin/classes', icon: Layers },
    { label: 'Fees & Paystack', path: '/admin/fees', icon: CreditCard },
    { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { label: 'Attendance & Leave', path: '/admin/attendance', icon: CheckSquare },
    { label: 'Exams & CBT', path: '/admin/exams', icon: Award },
    { label: 'Results & PINs', path: '/admin/results', icon: BookMarked },
    { label: 'E-Learning', path: '/admin/elearning', icon: BookOpen },
    { label: 'Communication Log', path: '/admin/communications', icon: MessageSquare },
    { label: 'Settings & Audit', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-navy text-white transition-transform duration-200 transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Brand header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-blue/30">
              F
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider uppercase text-white">Faith Spring School</div>
              <div className="text-[11px] text-amber-400 font-semibold tracking-wide">Admin Portal</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Current Term Pill */}
        <div className="px-5 py-3 bg-white/5 mx-3 mt-3 rounded-lg border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Session / Term:</span>
          <span className="bg-brand-amber text-brand-navy px-2 py-0.5 rounded font-bold">
            {activeSession.name} • T{activeTerm.term_number}
          </span>
        </div>

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
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30 font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-amber text-brand-navy font-bold flex items-center justify-center text-sm">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.full_name || 'Administrator'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@faithspringschool.ng'}</p>
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
              <span>Calabar, Cross River State</span>
              <ChevronRight size={14} />
              <span className="text-slate-800 font-semibold">{school.name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Scoped Academic Term Dropdown */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">Term:</span>
              <select 
                id="admin-scoped-term-selector"
                value={activeTerm?.id || ''} 
                onChange={(e) => setScopedTerm(e.target.value)}
                className="bg-transparent text-xs font-bold text-brand-navy focus:outline-none cursor-pointer pr-1"
              >
                {allTerms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.academic_sessions?.name || activeSession.name} • {term.name} {term.is_current ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative" title="Notifications">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
            </div>
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

export default AdminLayout;
