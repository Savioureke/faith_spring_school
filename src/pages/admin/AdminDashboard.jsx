import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Users, GraduationCap, CreditCard, Award, CheckSquare, 
  Calendar, Key, ArrowUpRight, TrendingUp, AlertCircle, RefreshCw 
} from 'lucide-react';

const AdminDashboard = () => {
  const { school, activeSession, activeTerm } = useSchool();
  const [stats, setStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    totalInvoiced: 0,
    totalCollected: 0,
    totalBalance: 0,
    collectionRate: 0,
    attendanceToday: 0,
    pinCount: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Students count
      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      
      // 2. Teachers count
      const { count: tCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });

      // 3. Financial invoices
      const { data: invData } = await supabase.from('invoices').select('total_amount, paid_amount, balance');
      const totalInv = (invData || []).reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      const totalCol = (invData || []).reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
      const totalBal = (invData || []).reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
      const rate = totalInv > 0 ? Math.round((totalCol / totalInv) * 100) : 0;

      // 4. PINs count
      const { count: pCount } = await supabase.from('result_pins').select('*', { count: 'exact', head: true });

      // 5. Attendance today
      const today = new Date().toISOString().split('T')[0];
      const { data: attData } = await supabase.from('attendance_records').select('status').eq('date', today);
      const presentCount = (attData || []).filter(a => a.status === 'present').length;

      // 6. Recent Payments
      const { data: recPay } = await supabase
        .from('payments')
        .select(`
          *,
          students (first_name, last_name, admission_number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        studentCount: sCount || 0,
        teacherCount: tCount || 0,
        totalInvoiced: totalInv,
        totalCollected: totalCol,
        totalBalance: totalBal,
        collectionRate: rate,
        attendanceToday: presentCount,
        pinCount: pCount || 0,
      });
      setRecentPayments(recPay || []);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-brand-amber/20 border border-brand-amber/40 text-brand-amber px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span>Official Administrative Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Faith Spring School Portal
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Bokkos LGA, Plateau State, Nigeria. Managing academic lifecycle, Paystack fee settlement, CBT examination, and PIN result publishing.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Link
              to="/admin/students"
              className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold shadow-lg transition-all"
            >
              + Admit Pupil
            </Link>
            <Link
              to="/admin/fees"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all"
            >
              Fees Ledger
            </Link>
            <Link
              to="/admin/results"
              className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl font-bold shadow-lg transition-all"
            >
              Generate PINs
            </Link>
          </div>
        </div>

        {/* Decorative Shapes */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <div className="w-80 h-80 rounded-full border-8 border-white"></div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Pupils</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.studentCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Primary 1-6 & Nursery</span>
            <Link to="/admin/students" className="text-brand-blue font-bold hover:underline">View All</Link>
          </div>
        </div>

        {/* Academic Staff */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Academic Staff</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.teacherCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Certified Teachers</span>
            <Link to="/admin/teachers" className="text-emerald-600 font-bold hover:underline">Manage</Link>
          </div>
        </div>

        {/* Fee Collection Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Fee Collection</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₦{Number(stats.totalCollected).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="font-bold text-emerald-600">{stats.collectionRate}% collected</span>
            <span className="text-amber-600 font-bold">₦{Number(stats.totalBalance).toLocaleString()} due</span>
          </div>
        </div>

        {/* Scratch-Card PINs */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Result PIN Tokens</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Key size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.pinCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Active Scratch Cards</span>
            <Link to="/admin/results" className="text-purple-600 font-bold hover:underline">Cards</Link>
          </div>
        </div>
      </div>

      {/* Grid: Recent Payments & Module Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Fee Payments (Paystack & Bursary)</h3>
            <Link to="/admin/fees" className="text-xs font-bold text-brand-blue hover:underline">
              View All Invoices
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Ref</th>
                  <th className="py-2.5 px-3">Pupil</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-blue">{p.payment_reference}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {p.students?.first_name} {p.students?.last_name}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        ₦{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-slate-600">{p.channel}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Module Shortcuts */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Quick Navigation Hub</h3>

          <Link
            to="/admin/timetable"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Calendar size={18} className="text-brand-blue" />
              <div>
                <div className="font-bold text-xs text-slate-800 group-hover:text-brand-blue">Class Timetable</div>
                <div className="text-[11px] text-slate-400">Weekly periods & conflict detection</div>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-brand-blue" />
          </Link>

          <Link
            to="/admin/attendance"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <CheckSquare size={18} className="text-emerald-600" />
              <div>
                <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">Attendance & Leave</div>
                <div className="text-[11px] text-slate-400">Daily registers & parent requests</div>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-700" />
          </Link>

          <Link
            to="/admin/exams"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-100 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Award size={18} className="text-purple-600" />
              <div>
                <div className="font-bold text-xs text-slate-800 group-hover:text-purple-700">Exams & CBT Testing</div>
                <div className="text-[11px] text-slate-400">Score sheets & auto-graded tests</div>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-purple-700" />
          </Link>

          <Link
            to="/results"
            className="flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Key size={18} className="text-amber-800" />
              <div>
                <div className="font-bold text-xs text-amber-900">Public Result Checker</div>
                <div className="text-[11px] text-amber-700">Test the scratch-card PIN portal</div>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-amber-800" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
