import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSchool } from '../context/SchoolContext';
import { 
  Key, Award, Printer, ArrowLeft, ShieldCheck, 
  AlertCircle, CheckCircle, RefreshCw, School 
} from 'lucide-react';
import ReportCardModal from '../components/ReportCardModal';

const ResultCheckerPublic = () => {
  const { school } = useSchool();
  const [admissionNumber, setAdmissionNumber] = useState('FSS/2025/001');
  const [pinCode, setPinCode] = useState('FSS-8492-4910-1823');
  const [verifying, setVerifying] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!admissionNumber || !pinCode) {
      setError('Please provide your admission number and scratch-card PIN');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-navy text-brand-amber flex items-center justify-center font-black text-xl shadow-md">
              F
            </div>
            <div>
              <div className="font-extrabold text-sm text-brand-navy tracking-wider uppercase">
                {school.name}
              </div>
              <div className="text-[11px] text-brand-blue font-semibold">
                Official Result Checker Portal
              </div>
            </div>
          </Link>

          <div className="flex items-center space-x-3 text-xs">
            <Link to="/" className="text-slate-600 hover:text-brand-blue font-semibold flex items-center space-x-1">
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-brand-navy text-white rounded-xl font-bold shadow-sm hover:bg-slate-800"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Banner */}
          <div className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 p-8 text-white text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-brand-amber text-brand-navy flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-amber/30">
              <Key size={30} />
            </div>
            <h1 className="text-2xl font-black">Scratch-Card Result Checker</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              Check term continuous assessment and terminal examination results without logging in.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="p-8 space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px]">
                Student Admission Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FSS/2025/001"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className="w-full p-3.5 border border-slate-200 rounded-xl font-mono font-bold text-brand-blue text-sm uppercase focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px]">
                Scratch-Card PIN Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FSS-8492-4910-1823"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full p-3.5 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 tracking-wider text-sm focus:ring-2 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default demo scratch-card loaded above for instant testing
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-4 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl font-black text-sm shadow-lg shadow-brand-amber/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {verifying ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying PIN Code...</span>
                </>
              ) : (
                <>
                  <Award size={18} />
                  <span>Unlock Terminal Report Card</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Cryptographically secured PIN system • Max 5 card views</span>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t bg-white">
        © {new Date().getFullYear()} {school.name}, Calabar, Cross River State, Nigeria. All rights reserved.
      </footer>

      {/* Printable Modal */}
      {reportData && (
        <ReportCardModal
          data={reportData}
          onClose={() => setReportData(null)}
        />
      )}
    </div>
  );
};

export default ResultCheckerPublic;
