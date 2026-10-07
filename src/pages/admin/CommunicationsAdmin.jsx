import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, Plus, Search, Filter, Send, 
  CheckCircle, User, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';
import { sendSmsNotification } from '../../lib/smsService';

const CommunicationsAdmin = () => {
  const { user } = useAuth();
  const { showToast } = useSchool();
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New message form
  const [targetStudentId, setTargetStudentId] = useState('');
  const [category, setCategory] = useState('Academic');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .select(`
          *,
          students (id, first_name, last_name, admission_number, classes (name, arm)),
          profiles:sender_id (full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);

      const { data: stData } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .order('last_name');

      setStudents(stData || []);
      if (stData?.length > 0 && !targetStudentId) {
        setTargetStudentId(stData[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading communications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!targetStudentId || !subject || !message) return;

    try {
      const { error } = await supabase
        .from('communication_logs')
        .insert({
          student_id: targetStudentId,
          sender_id: user?.id || 'demo-admin-001',
          category,
          subject,
          message,
        });

      if (error) throw error;

      // Dispatch SMS to student's parent/guardian
      const selectedStudent = students.find(s => s.id === targetStudentId);
      try {
        await sendSmsNotification({
          recipientPhone: selectedStudent?.phone || '08034567890',
          recipientName: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}'s Parent` : 'Parent',
          eventType: 'COMMUNICATION_LOG',
          message: `Faith Spring School Notice: New ${category} message regarding ${selectedStudent?.first_name || 'Pupil'}: "${subject}". Please check your portal for details.`,
          referenceId: targetStudentId,
        });
      } catch (smsErr) {
        console.warn('SMS dispatch error:', smsErr);
      }

      showToast('Communication note logged and sent to parent');
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      fetchCommunications();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Parent & Teacher Communication Logs</h1>
          <p className="text-xs text-slate-500">
            Structured logs for academic notes, behavioral observations, praise, and parent inquiries
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold shadow-md w-fit"
        >
          <Plus size={16} />
          <span>New Communication Note</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-brand-blue" />
            <p className="text-xs">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-600">No communication logs recorded</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    log.category === 'Academic' ? 'bg-blue-100 text-blue-800' :
                    log.category === 'Commendation' ? 'bg-emerald-100 text-emerald-800' :
                    log.category === 'Behavioral' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {log.category}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    Re: {log.students?.first_name} {log.students?.last_name} ({log.students?.admission_number})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              <div className="font-semibold text-xs text-brand-navy">
                Subject: {log.subject}
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{log.message}"
              </p>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Logged by: <strong>{log.profiles?.full_name || 'School Administration'}</strong></span>
                <span className="text-emerald-600 font-medium">Delivered to Parent Portal</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Log Communication Note</h3>
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Pupil *</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  <option value="Academic">Academic Progress</option>
                  <option value="Commendation">Praise & Commendation</option>
                  <option value="Behavioral">Behavioral Observation</option>
                  <option value="Health">Health Note</option>
                  <option value="General">General Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject Header *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excellent reading improvement"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Note / Message Content *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Write message details for parent..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue text-white rounded-xl font-bold"
                >
                  Send & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsAdmin;
