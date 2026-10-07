import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  CheckSquare, Calendar, UserCheck, UserX, Clock, 
  Filter, FileText, CheckCircle, XCircle, RefreshCw 
} from 'lucide-react';
import { sendSmsNotification } from '../../lib/smsService';

const AttendanceModule = () => {
  const { classes, showToast } = useSchool();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'student_leaves', 'staff_leaves'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [records, setRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch attendance records
      const { data: attData, error: aErr } = await supabase
        .from('attendance_records')
        .select(`
          *,
          students (id, first_name, last_name, admission_number, class_id),
          classes (name, arm)
        `)
        .order('date', { ascending: false });

      if (aErr) throw aErr;
      setRecords(attData || []);

      // 2. Fetch leave requests
      const { data: lData, error: lErr } = await supabase
        .from('leave_requests')
        .select(`
          *,
          students (first_name, last_name, admission_number),
          teachers (full_name, staff_id)
        `)
        .order('created_at', { ascending: false });

      if (lErr) throw lErr;
      setLeaveRequests(lData || []);

      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      showToast('Error loading attendance logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [classes]);

  // Leave approval
  const handleUpdateLeaveStatus = async (leaveId, status) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', leaveId);

      if (error) throw error;

      // Dispatch SMS alert for leave request status change
      const targetLeave = leaveRequests.find(l => l.id === leaveId);
      const recipientName = targetLeave?.students 
        ? `${targetLeave.students.first_name} ${targetLeave.students.last_name}'s Parent` 
        : (targetLeave?.teachers?.full_name || 'Staff Member');

      try {
        await sendSmsNotification({
          recipientPhone: targetLeave?.teachers?.phone || targetLeave?.students?.phone || '08034567890',
          recipientName,
          eventType: 'LEAVE_STATUS',
          message: `Faith Spring School HR Notice: Leave request from ${targetLeave?.start_date || 'period'} to ${targetLeave?.end_date || 'period'} has been ${status.toUpperCase()}.`,
          referenceId: leaveId,
        });
      } catch (smsErr) {
        console.warn('SMS dispatch error:', smsErr);
      }

      showToast(`Leave request marked as ${status}`);
      fetchAttendanceData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesDate = !selectedDate || r.date === selectedDate;
    const matchesClass = !selectedClassId || r.class_id === selectedClassId;
    return matchesDate && matchesClass;
  });

  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;

  const studentLeaves = leaveRequests.filter(l => l.leave_type === 'student');
  const staffLeaves = leaveRequests.filter(l => l.leave_type === 'staff');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Attendance & Leave Tracking</h1>
          <p className="text-xs text-slate-500">
            Daily pupil register records and parent/staff leave approval workflow
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'daily' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Class Register
        </button>
        <button
          onClick={() => setActiveTab('student_leaves')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'student_leaves' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parent Absence Requests ({studentLeaves.filter(l => l.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('staff_leaves')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'staff_leaves' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Staff Leave Applications ({staffLeaves.filter(l => l.status === 'pending').length} Pending)
        </button>
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Present: {presentCount}
              </span>
              <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                Late: {lateCount}
              </span>
              <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                Absent: {absentCount}
              </span>
              <button onClick={fetchAttendanceData} className="p-2 border rounded-xl hover:bg-slate-50 text-slate-600">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Pupil</th>
                  <th className="py-3 px-3">Admission No</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No attendance entries recorded for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.students?.first_name} {r.students?.last_name}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-blue">
                        {r.students?.admission_number}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {r.classes?.name} {r.classes?.arm}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{r.date}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 italic">{r.remarks || 'Normal'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Parent Leave Requests */}
      {activeTab === 'student_leaves' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Pupil Absence Requests from Parents</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {studentLeaves.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No student absence requests submitted.</div>
            ) : (
              studentLeaves.map(leave => (
                <div key={leave.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {leave.students?.first_name} {leave.students?.last_name} ({leave.students?.admission_number})
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Period: <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong>
                    </div>
                    <div className="text-slate-700 bg-slate-50 p-2 rounded-lg border mt-2">
                      Reason: "{leave.reason}"
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {leave.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {leave.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Staff Leave Requests */}
      {activeTab === 'staff_leaves' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Staff & Teacher Leave Applications</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {staffLeaves.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No staff leave applications submitted.</div>
            ) : (
              staffLeaves.map(leave => (
                <div key={leave.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {leave.teachers?.full_name} ({leave.teachers?.staff_id})
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Period: <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong>
                    </div>
                    <div className="text-slate-700 bg-slate-50 p-2 rounded-lg border mt-2">
                      Reason: "{leave.reason}"
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {leave.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {leave.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceModule;
