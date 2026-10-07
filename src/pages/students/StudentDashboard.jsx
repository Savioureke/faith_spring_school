import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { supabase } from '../../lib/supabase';
import { 
  GraduationCap, CreditCard, Award, BookOpen, Calendar, 
  ArrowUpRight, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, activeWard, isParent } = useAuth();
  const { activeSession, activeTerm } = useSchool();
  const [invoice, setInvoice] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);

  const currentStudentId = isParent ? activeWard?.id : (user?.student_id || user?.id);

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      // 1. Fetch fee invoice
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setInvoice(inv);

      // 2. Fetch report card
      const { data: rc } = await supabase
        .from('report_cards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setReportCard(rc);

      // 3. Fetch schedule
      const { data: slots } = await supabase
        .from('timetable_slots')
        .select('*, subjects (name, code), teachers (full_name)')
        .eq('day_of_week', 'Monday')
        .order('period_number')
        .limit(4);

      setTodaySchedule(slots || []);
    };

    fetchStudentDashboard();
  }, [currentStudentId]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="inline-flex items-center space-x-2 bg-brand-amber text-brand-navy px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-md">
          <span>{isParent ? 'Parent & Guardian Portal' : 'Student Portal'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Hello, {isParent ? activeWard?.name : user?.full_name}!
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1">
          {isParent ? `Monitoring academic progress & fees for ${activeWard?.name}` : 'Welcome to your Faith Spring School pupil dashboard.'}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link
            to="/students/fees"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            Pay School Fees Online
          </Link>
          <Link
            to="/students/results"
            className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl font-bold shadow-lg transition-all"
          >
            Check Term Results (PIN)
          </Link>
          <Link
            to="/students/exams"
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold transition-all"
          >
            Take CBT Online Test
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fees Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Term School Fees</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            ₦{Number(invoice?.balance || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className={invoice?.balance > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
              {invoice?.balance > 0 ? 'Outstanding Due' : 'Fully Paid'}
            </span>
            <Link to="/students/fees" className="text-brand-blue font-bold hover:underline">
              Paystack ↗
            </Link>
          </div>
        </div>

        {/* Academic Result Card */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Terminal Performance</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {reportCard?.average_score ? `${reportCard.average_score}%` : '87.08%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="text-emerald-700 font-bold">Position: 1st of 28</span>
            <Link to="/students/results" className="text-purple-600 font-bold hover:underline">
              Report Card
            </Link>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Attendance Record</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            63 / 65 Days
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="text-emerald-600 font-bold">97% Punctual</span>
            <span className="text-slate-400">Excellent</span>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Calendar size={18} className="text-brand-blue" />
            <span>Class Timetable Preview</span>
          </h3>
          <Link to="/students/timetable" className="text-xs font-bold text-brand-blue hover:underline">
            View Full Timetable ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {todaySchedule.map(slot => (
            <div key={slot.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                Period {slot.period_number}
              </span>
              <div className="font-bold text-slate-900 text-sm mt-2">{slot.subjects?.name}</div>
              <div className="text-slate-500 text-[11px]">{slot.teachers?.full_name || 'Class Teacher'}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">{slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
