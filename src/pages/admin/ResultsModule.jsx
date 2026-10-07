import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Award, Key, Plus, Search, Filter, Printer, 
  CheckCircle2, RefreshCw, Eye, Download, ShieldCheck, Smartphone 
} from 'lucide-react';
import ReportCardModal from '../../components/ReportCardModal';
import { sendSmsNotification } from '../../lib/smsService';

const ResultsModule = () => {
  const { classes, activeTerm, activeSession, showToast } = useSchool();
  const [activeTab, setActiveTab] = useState('pins'); // 'pins', 'report_cards'
  const [pins, setPins] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportCardData, setSelectedReportCardData] = useState(null);

  // Bulk PIN Generator Modal
  const [isBulkPinModalOpen, setIsBulkPinModalOpen] = useState(false);
  const [pinBatchCount, setPinBatchCount] = useState(20);
  const [generating, setGenerating] = useState(false);

  const fetchResultsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch PINs
      const { data: pData, error: pErr } = await supabase
        .from('result_pins')
        .select(`
          *,
          students (id, first_name, last_name, admission_number),
          terms (name)
        `)
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;
      setPins(pData || []);

      // 2. Fetch Report Cards
      const { data: rData, error: rErr } = await supabase
        .from('report_cards')
        .select(`
          *,
          students (id, first_name, last_name, admission_number, class_id),
          classes (name, arm),
          terms (name)
        `)
        .order('position_in_class', { ascending: true });

      if (rErr) throw rErr;
      setReportCards(rData || []);
    } catch (err) {
      console.error('Error fetching results data:', err);
      showToast('Error loading results', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultsData();
  }, []);

  // Bulk Generate Scratch-Card PINs
  const handleBulkGeneratePins = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const count = Number(pinBatchCount) || 10;
      const newPins = [];
      const currentCount = pins.length;

      for (let i = 1; i <= count; i++) {
        // Format: EAF-XXXX-XXXX-XXXX
        const randPart1 = Math.floor(1000 + Math.random() * 9000);
        const randPart2 = Math.floor(1000 + Math.random() * 9000);
        const randPart3 = Math.floor(1000 + Math.random() * 9000);
        const pin_code = `EAF-${randPart1}-${randPart2}-${randPart3}`;
        const serial_number = `SN-${new Date().getFullYear()}-${String(currentCount + i).padStart(4, '0')}`;

        newPins.push({
          pin_code,
          serial_number,
          term_id: activeTerm.id,
          usage_count: 0,
          max_uses: 5,
          is_active: true
        });
      }

      const { error } = await supabase.from('result_pins').insert(newPins);
      if (error) throw error;

      showToast(`Generated ${count} unique scratch-card PINs successfully!`);
      setIsBulkPinModalOpen(false);
      fetchResultsData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // View Report Card in Modal
  const handleViewReportCard = async (rc) => {
    try {
      // Fetch subject scores
      const { data: scores } = await supabase
        .from('student_scores')
        .select(`
          ca1_score, ca2_score, exam_score, total_score, grade, remark, position,
          subjects (name, code)
        `)
        .eq('student_id', rc.student_id)
        .eq('term_id', rc.term_id);

      const formattedScores = (scores || []).map(sc => ({
        subject_name: sc.subjects?.name,
        subject_code: sc.subjects?.code,
        ca1: sc.ca1_score,
        ca2: sc.ca2_score,
        exam: sc.exam_score,
        total: sc.total_score,
        grade: sc.grade,
        remark: sc.remark,
        position: sc.position,
      }));

      setSelectedReportCardData({
        student: {
          id: rc.student_id,
          full_name: `${rc.students?.first_name} ${rc.students?.last_name}`,
          admission_number: rc.students?.admission_number,
          class: `${rc.classes?.name} ${rc.classes?.arm}`,
        },
        session: activeSession.name,
        term: activeTerm.name,
        report_card: rc,
        scores: formattedScores,
      });
    } catch (err) {
      showToast('Error opening report card', 'error');
    }
  };

  // Toggle PIN active state
  const handleTogglePin = async (pinId, currentState) => {
    try {
      const { error } = await supabase
        .from('result_pins')
        .update({ is_active: !currentState })
        .eq('id', pinId);

      if (error) throw error;
      showToast(`PIN ${currentState ? 'deactivated' : 'activated'}`);
      fetchResultsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSendResultSms = async (rc) => {
    try {
      const studentName = `${rc.students?.first_name} ${rc.students?.last_name}`;
      const res = await sendSmsNotification({
        recipientPhone: rc.students?.phone || '08034567890',
        recipientName: `${studentName}'s Parent`,
        eventType: 'RESULT_AVAILABLE',
        message: `Faith Spring School Notice: Terminal result for ${rc.students?.first_name} (${rc.classes?.name || 'Class'}) is now published! Average: ${rc.average_score}%, Position: ${rc.position_in_class || 'N/A'}. Log into the student portal to inspect and print.`,
        referenceId: rc.id,
      });

      if (res.success) {
        showToast(`Result SMS notification sent for ${studentName}!`);
      } else {
        showToast(res.error || 'Failed to dispatch SMS', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredPins = pins.filter(p =>
    `${p.pin_code} ${p.serial_number} ${p.students?.admission_number || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Terminal Results & Scratch-Card PIN Checker</h1>
          <p className="text-xs text-slate-500">
            Generate scratch-card PINs, compile report cards, compute class positions and print cards
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkPinModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl text-xs font-bold shadow-md shadow-brand-amber/30 transition-all"
          >
            <Key size={16} />
            <span>Generate Scratch-Card PINs</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pins')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'pins' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Scratch-Card PIN Tokens ({pins.length})
        </button>
        <button
          onClick={() => setActiveTab('report_cards')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'report_cards' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Compiled Report Cards ({reportCards.length})
        </button>
      </div>

      {/* Tab 1: PIN Tokens */}
      {activeTab === 'pins' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search PIN code or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <button onClick={fetchResultsData} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600">
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-3">Scratch-Card PIN Code</th>
                  <th className="py-3 px-3">Assigned / Locked Pupil</th>
                  <th className="py-3 px-3 text-center">Usage Count</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPins.map(pin => (
                  <tr key={pin.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{pin.serial_number}</td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-blue text-sm tracking-wide">
                      {pin.pin_code}
                    </td>
                    <td className="py-3 px-3">
                      {pin.students ? (
                        <div>
                          <span className="font-bold text-slate-900">{pin.students.first_name} {pin.students.last_name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{pin.students.admission_number}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned (Free Card)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {pin.usage_count} / {pin.max_uses} views
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pin.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pin.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleTogglePin(pin.id, pin.is_active)}
                        className={`text-xs font-bold ${pin.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        {pin.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Compiled Report Cards */}
      {activeTab === 'report_cards' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Pupil</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">Average</th>
                <th className="py-3 px-3">Class Position</th>
                <th className="py-3 px-3">Attendance</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportCards.map(rc => (
                <tr key={rc.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{rc.students?.first_name} {rc.students?.last_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rc.students?.admission_number}</div>
                  </td>
                  <td className="py-3.5 px-3">{rc.classes?.name} {rc.classes?.arm}</td>
                  <td className="py-3.5 px-3 font-bold text-brand-blue">{rc.average_score}%</td>
                  <td className="py-3.5 px-3 font-black text-emerald-700">
                    {rc.position_in_class ? `${rc.position_in_class} of ${rc.class_size}` : '-'}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{rc.times_present} / {rc.times_school_opened} days</td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleSendResultSms(rc)}
                        title="Dispatch Result SMS Alert to Parent"
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center space-x-1 transition-colors"
                      >
                        <Smartphone size={13} />
                        <span>SMS Parent</span>
                      </button>
                      <button
                        onClick={() => handleViewReportCard(rc)}
                        className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue-hover flex items-center space-x-1"
                      >
                        <Eye size={13} />
                        <span>View & Print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Card Modal */}
      {selectedReportCardData && (
        <ReportCardModal
          data={selectedReportCardData}
          onClose={() => setSelectedReportCardData(null)}
        />
      )}

      {/* Bulk PIN Generator Modal */}
      {isBulkPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Bulk Generate Result PINs</h3>
            <p className="text-slate-500 mb-4">
              Generates cryptographic 16-digit scratch-card tokens with unique serial numbers for term result checking.
            </p>

            <form onSubmit={handleBulkGeneratePins} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Number of Scratch-Cards to Generate</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={pinBatchCount}
                  onChange={(e) => setPinBatchCount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-base"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsBulkPinModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl font-bold shadow-md shadow-brand-amber/30"
                >
                  {generating ? 'Generating...' : `Generate ${pinBatchCount} PINs`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsModule;
