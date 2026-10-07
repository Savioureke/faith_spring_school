import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { Award, Key, Printer, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import ReportCardModal from '../../components/ReportCardModal';

const StudentResults = () => {
  const { user, activeWard, isParent } = useAuth();
  const { showToast } = useSchool();

  const studentAdmission = isParent ? activeWard?.admission_number : user?.admission_number;
  const [admissionNumber, setAdmissionNumber] = useState(studentAdmission || 'FSS/2025/001');
  const [pinCode, setPinCode] = useState('FSS-8492-4910-1823');
  const [verifying, setVerifying] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckResult = async (e) => {
    e.preventDefault();
    if (!admissionNumber || !pinCode) {
      setError('Please provide both your admission number and scratch-card PIN');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const { data, error: rpcErr } = await supabase.rpc('verify_result_pin', {
        p_admission_number: admissionNumber.trim(),
        p_pin_code: pinCode.trim(),
      });

      if (rpcErr) throw rpcErr;

      if (data && data.success) {
        setReportData(data);
        showToast('Result unlocked successfully!');
      } else {
        setError(data?.message || 'Invalid Admission Number or PIN Code');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to verify PIN code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Terminal Result Checker</h1>
        <p className="text-xs text-slate-500">
          Enter your unique scratch-card PIN code to unlock and print your terminal academic report card
        </p>
      </div>

      {/* PIN Check Form */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Key size={26} />
          </div>
          <h2 className="text-lg font-black text-slate-900">Scratch-Card PIN Verification</h2>
          <p className="text-xs text-slate-500 mt-1">
            Scratch cards are issued by the school administration at the end of each academic term.
          </p>
        </div>

        <form onSubmit={handleCheckResult} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Student Admission Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. FSS/2025/001"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl font-mono font-bold text-brand-blue uppercase text-sm focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Scratch-Card PIN Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. FSS-8492-4910-1823"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 tracking-wider text-sm focus:ring-2 focus:ring-brand-blue"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Format: FSS-XXXX-XXXX-XXXX (Default demo PIN loaded above)
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3.5 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl font-extrabold text-sm shadow-md shadow-brand-amber/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {verifying ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Verifying Scratch-Card...</span>
              </>
            ) : (
              <>
                <Award size={16} />
                <span>Check & View Result</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Report Card Viewer Modal */}
      {reportData && (
        <ReportCardModal
          data={reportData}
          onClose={() => setReportData(null)}
        />
      )}
    </div>
  );
};

export default StudentResults;
