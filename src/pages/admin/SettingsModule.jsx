import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { sendSmsNotification } from '../../lib/smsService';
import { 
  Settings, Award, Calendar, ShieldCheck, History, 
  CheckCircle2, Plus, MessageSquare, Send, RefreshCw, 
  ArrowRight, ExternalLink, X, Smartphone, Filter
} from 'lucide-react';

const SettingsModule = () => {
  const { 
    school, 
    activeSession, 
    activeTerm, 
    showToast, 
    refreshSchoolData, 
    setScopedTerm, 
    createAcademicSession 
  } = useSchool();

  const [activeTab, setActiveTab] = useState('terms'); // 'terms', 'grading', 'sms', 'audit'
  const [gradingScales, setGradingScales] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Academic Session Modal
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('2027/2028');
  const [newStartDate, setNewStartDate] = useState('2027-09-13');
  const [newEndDate, setNewEndDate] = useState('2028-07-21');
  const [creatingSession, setCreatingSession] = useState(false);

  // Test SMS Modal
  const [isTestSmsModalOpen, setIsTestSmsModalOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState('08034567890');
  const [smsRecipient, setSmsRecipient] = useState('Saviour (Technical Lead)');
  const [smsEvent, setSmsEvent] = useState('GENERAL');
  const [smsMessage, setSmsMessage] = useState('Faith Spring School Test SMS: Term portal live with SMS dispatch system active.');
  const [sendingSms, setSendingSms] = useState(false);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Grading
      const { data: gData } = await supabase.from('grading_scales').select('*').order('min_score', { ascending: false });
      setGradingScales(gData || []);

      // 2. Fetch Sessions
      const { data: sData } = await supabase.from('academic_sessions').select('*').order('start_date', { ascending: false });
      setSessions(sData || []);

      // 3. Fetch Terms
      const { data: tData } = await supabase.from('terms').select('*, academic_sessions(name)').order('term_number', { ascending: true });
      setTerms(tData || []);

      // 4. Fetch SMS logs
      const { data: smsData } = await supabase.from('sms_logs').select('*').order('created_at', { ascending: false }).limit(50);
      setSmsLogs(smsData || []);

      // 5. Fetch Audit logs
      const { data: aData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(30);
      setAuditLogs(aData || []);
    } catch (err) {
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  // Handle Set Current Term (Database default)
  const handleSetCurrentTerm = async (termId) => {
    try {
      await supabase.from('terms').update({ is_current: false }).neq('id', termId);
      await supabase.from('terms').update({ is_current: true }).eq('id', termId);
      showToast('School active default term updated successfully!');
      await refreshSchoolData();
      await fetchSettingsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Create Session
  const handleCreateSessionSubmit = async (e) => {
    e.preventDefault();
    if (!newSessionName || !newStartDate || !newEndDate) {
      showToast('Please provide all session details', 'error');
      return;
    }

    setCreatingSession(true);
    try {
      const res = await createAcademicSession(newSessionName.trim(), newStartDate, newEndDate);
      if (res.success) {
        setIsNewSessionModalOpen(false);
        setNewSessionName('');
        await fetchSettingsData();
      }
    } finally {
      setCreatingSession(false);
    }
  };

  // Handle Send Test SMS
  const handleSendTestSms = async (e) => {
    e.preventDefault();
    if (!smsPhone || !smsMessage) return;

    setSendingSms(true);
    try {
      const res = await sendSmsNotification({
        recipientPhone: smsPhone.trim(),
        recipientName: smsRecipient.trim(),
        eventType: smsEvent,
        message: smsMessage.trim(),
      });

      if (res.success) {
        showToast('SMS dispatched and logged successfully!');
        setIsTestSmsModalOpen(false);
        fetchSettingsData();
      } else {
        showToast(res.error || 'Failed to dispatch SMS', 'error');
      }
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">System Settings & Governance</h1>
          <p className="text-xs text-slate-500">
            Academic sessions, term lifecycle scoping, Nigerian grading standards, SMS gateway, and audit trail
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'terms' && (
            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-blue/20 transition-all"
            >
              <Plus size={16} />
              <span>+ New Academic Session</span>
            </button>
          )}

          {activeTab === 'sms' && (
            <button
              onClick={() => setIsTestSmsModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Smartphone size={16} className="text-brand-amber" />
              <span>Send Test SMS</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-8 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'terms' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Academic Sessions & Terms Lifecycle
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'grading' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Grading Scale (Nigerian Standard)
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'sms' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SMS Delivery Gateway ({smsLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'audit' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Compliance & Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: ACADEMIC SESSIONS & TERMS LIFECYCLE */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-brand-navy block text-sm">Active Scoped Portal View:</span>
              <span className="text-slate-600">
                You are currently viewing data scoped to <strong className="text-brand-blue">{activeSession.name} • {activeTerm.name}</strong>.
                Switching terms updates financial invoices, attendance records, CBT exams, and timetable views instantly.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[11px] whitespace-nowrap">
                ● Currently Scoped
              </span>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-6">
            {sessions.map((sess) => {
              const sessionTerms = terms.filter(t => t.session_id === sess.id);

              return (
                <div key={sess.id} className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-navy text-white flex items-center justify-center font-bold text-sm">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-base flex items-center space-x-2">
                          <span>{sess.name} Academic Session</span>
                          {sess.is_current && (
                            <span className="bg-brand-amber text-brand-navy text-[10px] font-black uppercase px-2 py-0.5 rounded">
                              Current School Year
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          Timeline: {sess.start_date} to {sess.end_date}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms within Session */}
                  <div className="p-4 sm:p-6 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Terms within this Academic Session
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sessionTerms.map((t) => {
                        const isScoped = activeTerm.id === t.id;
                        const isDefault = t.is_current;

                        return (
                          <div 
                            key={t.id} 
                            className={`p-4 rounded-xl border transition-all ${
                              isScoped 
                                ? 'border-brand-blue bg-blue-50/40 ring-2 ring-brand-blue/30 shadow-md' 
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-slate-900">{t.name}</span>
                              <div className="flex items-center space-x-1">
                                {isScoped && (
                                  <span className="bg-brand-blue text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                                    Viewing
                                  </span>
                                )}
                                {isDefault && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    School Active
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 mb-4">
                              {t.start_date || 'Sept'} — {t.end_date || 'Dec'}
                              <br />
                              <span className="text-[10px] text-slate-400">Next Term: {t.next_term_begins || 'TBD'}</span>
                            </p>

                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => setScopedTerm(t.id)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                                  isScoped 
                                    ? 'bg-brand-blue text-white shadow-sm' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                              >
                                <ExternalLink size={13} />
                                <span>{isScoped ? 'Dashboard Active' : 'Open Term Dashboard'}</span>
                              </button>

                              {!isDefault && (
                                <button
                                  onClick={() => handleSetCurrentTerm(t.id)}
                                  className="w-full py-1 px-3 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                                >
                                  Set as School Default
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GRADING SCALE CONFIGURATION */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Standard Nigerian Primary School Grading Benchmark</h3>
              <p className="text-xs text-slate-500">
                Continuous assessment (40%: CA1 20% + CA2 20%) and Terminal examination (60%) composite scale
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
              Standard Active Benchmark
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500">
                <tr>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Score Range</th>
                  <th className="p-3">Remarks / Performance Description</th>
                  <th className="p-3">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {gradingScales.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-brand-navy text-sm">{g.grade}</td>
                    <td className="p-3 font-semibold text-slate-700">{g.min_score}% — {g.max_score}%</td>
                    <td className="p-3 text-slate-800">{g.remark}</td>
                    <td className="p-3 font-mono font-bold text-brand-blue">{g.gpa_point}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SMS DELIVERY GATEWAY & LOGS */}
      {activeTab === 'sms' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">SMS Delivery Gateway & Event Logs</h3>
              <p className="text-xs text-slate-500">
                Automated SMS alerts dispatched to Nigerian parent/staff phone numbers via Termii Gateway
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 size={13} />
                <span>Gateway: Termii (Nigeria) Active</span>
              </span>
            </div>
          </div>

          {/* SMS Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Phone Number</th>
                  <th className="p-3.5">Trigger Event</th>
                  <th className="p-3.5">Message Content</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {smsLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No SMS alerts logged yet. Use "Send Test SMS" above to test gateway delivery.
                    </td>
                  </tr>
                ) : (
                  smsLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">{log.recipient_name}</td>
                      <td className="p-3.5 font-mono text-brand-blue font-semibold">{log.recipient_phone}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.event_type === 'FEE_PAYMENT' ? 'bg-emerald-100 text-emerald-800' :
                          log.event_type === 'RESULT_AVAILABLE' ? 'bg-amber-100 text-amber-800' :
                          log.event_type === 'COMMUNICATION_LOG' ? 'bg-blue-100 text-blue-800' :
                          log.event_type === 'LEAVE_STATUS' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 max-w-xs truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLIANCE & AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-slate-900 text-sm">Financial & Academic Immutable Audit Trail</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-brand-navy">{log.action}</td>
                  <td className="p-3 uppercase text-slate-500 font-mono text-[11px]">{log.entity}</td>
                  <td className="p-3 text-slate-700 font-mono text-[11px]">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="p-3 text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: CREATE ACADEMIC SESSION */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create New Academic Session</h3>
              <button onClick={() => setIsNewSessionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Session Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027/2028"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Will automatically generate First Term, Second Term, and Third Term records.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSession}
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold flex items-center space-x-1.5"
                >
                  {creatingSession ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Create Session & 3 Terms</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND TEST SMS */}
      {isTestSmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Dispatch Nigerian SMS Alert</h3>
              <button onClick={() => setIsTestSmsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendTestSms} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={smsRecipient}
                  onChange={(e) => setSmsRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nigerian Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 08034567890"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notification Event Type</label>
                <select
                  value={smsEvent}
                  onChange={(e) => setSmsEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="FEE_PAYMENT">FEE_PAYMENT (Fee Payment Confirmation)</option>
                  <option value="RESULT_AVAILABLE">RESULT_AVAILABLE (New Result Available)</option>
                  <option value="COMMUNICATION_LOG">COMMUNICATION_LOG (New Communication Entry)</option>
                  <option value="LEAVE_STATUS">LEAVE_STATUS (Leave Request Status Change)</option>
                  <option value="GENERAL">GENERAL (School Broadcast)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">SMS Message Text *</label>
                <textarea
                  rows="3"
                  required
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTestSmsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingSms}
                  className="px-4 py-2 bg-brand-navy text-white rounded-xl font-bold flex items-center space-x-1.5"
                >
                  {sendingSms ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Dispatch SMS via Termii</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
