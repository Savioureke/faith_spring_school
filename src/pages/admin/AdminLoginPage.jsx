import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

const AdminLoginPage = () => {
  const { loginWithCredentials } = useAuth();
  const { school } = useSchool();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await loginWithCredentials(email.trim(), password, 'admin');
    setLoading(false);

    if (result.success) {
      if (result.role !== 'admin') {
        setError('Access Denied: This console is strictly for school administrators. Pupils and teachers should use their respective portals.');
      }
      // If role === 'admin', AuthContext updates user and AdminLayout re-renders dashboard immediately!
    } else {
      setError(result.error || 'Invalid administrator credentials. Please check your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center space-x-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy text-brand-amber flex items-center justify-center font-black text-2xl shadow-2xl border-2 border-brand-amber">
            E
          </div>
        </Link>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck size={14} />
          <span>Restricted Access</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          Administrator Console
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {school.name} • Bokkos, Plateau State
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-700 space-y-6">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-sm">Administrative Sign In</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter authorized school administrative credentials to access governance, bursary, and records.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10px]">
                Admin Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@faithspringschool.sch.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-brand-blue placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[10px]">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-brand-blue placeholder-slate-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold shadow-lg shadow-brand-blue/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-xs tracking-wider uppercase mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Authenticating Administrator...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
            <span>256-Bit SSL Enforced</span>
            <Link to="/" className="text-amber-400 font-semibold hover:underline">
              ← Return to School Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
