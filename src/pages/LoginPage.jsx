import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { 
  Lock, User, ArrowRight, GraduationCap, 
  AlertCircle, RefreshCw, KeyRound, CreditCard
} from 'lucide-react';

const LoginPage = () => {
  const { loginWithCredentials } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanId = identifier.trim();
    const result = await loginWithCredentials(cleanId, password, 'student');
    setLoading(false);

    if (result.success && result.role) {
      if (result.role === 'admin') {
        setError('Administrator account detected. This portal is for pupils and parents only. Please access the Administrator Console directly at /admin.');
      } else if (result.role === 'teacher') {
        setError('Teaching staff account detected. This portal is for pupils and parents only. Please access the Teacher Workspace directly at /teachers.');
      } else {
        // 'student' or 'parent' -> direct to student portal
        navigate('/students', { replace: true });
      }
    } else {
      setError(result.error || 'Invalid admission number/email or password. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-navy text-brand-amber flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-navy/20 border-2 border-brand-amber">
            F
          </div>
        </Link>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-brand-blue text-xs font-bold uppercase tracking-wider mb-2">
          <GraduationCap size={15} />
          <span>Pupil & Parent Portal</span>
        </div>
        <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">
          {school.name}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Calabar, Cross River State • Terminal Results, CBT Exams & School Fees
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Pupil / Guardian Sign In</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your Student Admission Number (e.g. <span className="font-mono text-brand-blue font-semibold">FSS/2025/001</span>) or registered parent email address.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px]">
                Admission Number or Email *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. FSS/2025/001 or parent@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px]">
                Portal Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-navy hover:bg-slate-800 text-white rounded-xl font-bold shadow-md shadow-brand-navy/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-xs tracking-wider uppercase mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Verifying Student Account...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Student Dashboard</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center space-x-2 text-slate-700 font-bold">
              <KeyRound size={14} className="text-brand-amber flex-shrink-0" />
              <span>Checking Terminal Results?</span>
            </div>
            <p>
              Log in with your admission number above, then navigate to <strong>Term Results & PIN</strong> inside your dashboard to enter your scratch-card token.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Official Student Portal</span>
            <Link to="/" className="text-brand-blue font-semibold hover:underline">
              ← Return to School Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
