import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { 
  Home, CheckSquare, Award, BookOpen, Calendar, 
  MessageSquare, FileText, LogOut, Menu, X, Bell, ChevronRight
} from 'lucide-react';
import TeacherLoginPage from '../pages/teachers/TeacherLoginPage';

const TeacherLayout = () => {
  const { user, isTeacher, logout } = useAuth();
  const { school, activeSession, activeTerm } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If not logged in as teacher, display the dedicated Teacher Workspace Login Form
  if (!user || !isTeacher) {
    return <TeacherLoginPage />;
  }

  const navItems = [
    { label: 'My Dashboard', path: '/teachers', icon: Home, exact: true },
    { label: 'Mark Attendance', path: '/teachers/attendance', icon: CheckSquare },
    { label: 'Exams & CBT', path: '/teachers/exams', icon: Award },
    { label: 'E-Learning Uploads', path: '/teachers/elearning', icon: BookOpen },
    { label: 'Teaching Schedule', path: '/teachers/timetable', icon: Calendar },
    { label: 'Parent Logs', path: '/teachers/communications', icon: MessageSquare },
    { label: 'Staff Leave', path: '/teachers/leave', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transition-transform duration-200 transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-blue/30">
              F
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider uppercase text-white">Faith Spring School</div>
              <div className="text-[11px] text-emerald-400 font-semibold tracking-wide">Teacher Portal</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Current Term Pill */}
        <div className="px-5 py-3 bg-slate-800/60 mx-3 mt-3 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Session / Term:</span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
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
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Teacher profile summary */}
        <div className="p-4 border-t border-slate-800 bg-black/20">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-900 font-bold flex items-center justify-center text-sm">
              {user?.full_name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.full_name || 'Staff Teacher'}</p>
              <p className="text-xs text-emerald-400 truncate">{user?.specialization || 'Class Teacher'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-medium transition-colors"
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
              <span className="font-semibold text-slate-800">Teacher Workspace</span>
              <ChevronRight size={14} />
              <span>{school.name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              Academic Staff
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

export default TeacherLayout;
