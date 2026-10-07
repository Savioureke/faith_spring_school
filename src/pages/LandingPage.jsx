import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { 
  Award, CreditCard, BookOpen, Users, CheckCircle2, 
  ArrowRight, Phone, Mail, MapPin, Menu, X, School, LogIn
} from 'lucide-react';

const LandingPage = () => {
  const { school, activeSession, activeTerm } = useSchool();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-montserrat overflow-x-hidden">
      {/* Top Banner Notice */}
      <div className="bg-brand-navy text-white text-xs py-2.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="bg-brand-amber text-brand-navy font-black px-2 py-0.5 rounded text-[10px] uppercase">
              Now Enrolling
            </span>
            <span className="text-slate-200 font-medium">
              2026/2027 Academic Session • First Term Active in Calabar, Cross River State
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Phone size={13} className="text-brand-amber" />
              <span className="font-mono">{school.phone}</span>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:flex items-center space-x-1.5">
              <Mail size={13} className="text-brand-amber" />
              <span>{school.email}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-navy text-brand-amber flex items-center justify-center font-black text-2xl border-2 border-brand-amber shadow-md">
              F
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg tracking-wider text-brand-navy uppercase">
                {school.name}
              </div>
              <div className="text-[10px] sm:text-[11px] text-brand-blue font-semibold tracking-wide">
                Calabar, Cross River State • Primary School
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <a href="#home" className="text-brand-blue transition-colors">Home</a>
            <a href="#about" className="hover:text-brand-blue transition-colors">About Us</a>
            <a href="#curriculum" className="hover:text-brand-blue transition-colors">Curriculum</a>
            <a href="#features" className="hover:text-brand-blue transition-colors">Portal Features</a>
          </nav>

          {/* Single Secure Portal Login Button */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-navy hover:bg-slate-800 shadow-md shadow-brand-navy/20 transition-all flex items-center space-x-2"
            >
              <LogIn size={15} />
              <span>Portal Login</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 text-sm font-bold shadow-xl">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800">Home</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800">About Faith Spring School</a>
            <a href="#curriculum" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800">Curriculum</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800">Portal Features</a>
            <div className="pt-3 border-t">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-brand-navy text-white rounded-xl font-bold flex items-center justify-center space-x-2"
              >
                <LogIn size={16} />
                <span>Portal Login</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Floating original shapes preserved */}
        <div className="absolute top-10 left-6 pointer-events-none opacity-60 zigzag-1">
          <img src="/img/shape-1.png" alt="art shape" width="70" />
        </div>
        <div className="absolute top-24 right-10 pointer-events-none opacity-50 drop-anim">
          <img src="/img/shape-2.png" alt="art shape" width="50" />
        </div>
        <div className="absolute bottom-10 left-1/3 pointer-events-none opacity-30 zigzag-2">
          <img src="/img/shape-3.png" alt="art shape" width="100" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Copy */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-brand-blue px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
                <span>Welcome to Faith Spring School</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-tight">
                Nurturing Excellence, Character & Knowledge in{' '}
                <span className="text-brand-blue relative inline-block">
                  Calabar
                  <img src="/img/banner-line.png" alt="line" className="absolute -bottom-2 left-0 w-full" />
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                A premier primary school in Calabar, Cross River State providing state-of-the-art digital education management: automated online Paystack fee payments, scratch-card PIN result checker, CBT computer testing, and real-time attendance registers.
              </p>

              {/* Single Login Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-blue/30 transition-all flex items-center justify-center space-x-2"
                >
                  <LogIn size={16} />
                  <span>Access School Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Quick stats pills */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-brand-navy">100%</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Digital Bursary</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-brand-blue">Primary 1-6</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">& Nursery Arms</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">SMS Alerts</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">Real-Time Notice</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image / Illustration */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-lg">
                <img
                  src="/img/banner-img.png"
                  alt="Faith Spring School Pupil"
                  className="w-full h-auto drop-shadow-2xl relative z-10"
                />

                {/* Floating pill 1: Paystack */}
                <div className="absolute top-10 -left-4 z-20 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-3 drop-anim">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-slate-900">Paystack Integrated</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Instant Fee Receipts</div>
                  </div>
                </div>

                {/* Floating pill 2: CBT Testing */}
                <div className="absolute bottom-10 -right-4 z-20 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-3 zigzag-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-slate-900">Computer Testing</div>
                    <div className="text-[10px] text-amber-700 font-semibold">Instant Auto-Grading</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Core Capabilities Section */}
      <section id="features" className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-blue uppercase font-bold text-xs tracking-wider">
              Educational Technology
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy mt-1">
              Integrated School Management System
            </h2>
            <p className="text-slate-500 text-xs mt-2">
              All academic and administrative operations unified under one secure, cloud-powered infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-navy text-brand-amber flex items-center justify-center mb-4 shadow-md font-bold">
                  <CreditCard size={24} />
                </div>
                <h3 className="font-black text-slate-900 text-lg">Online Fees & Automated Receipts</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Seamless Paystack integration supporting Debit Cards, Direct Bank Transfers, and USSD with partial payment installments, verified server-side with instant official printable receipts.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md font-bold">
                  <Award size={24} />
                </div>
                <h3 className="font-black text-slate-900 text-lg">Continuous Assessment & CBT</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Child-friendly Computer-Based Testing engine, automated grading, manual CA1 and CA2 score entry, and composite terminal marks following the Nigerian national curriculum.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-amber text-brand-navy flex items-center justify-center mb-4 shadow-md font-bold">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-black text-slate-900 text-lg">E-Learning & Attendance</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Weekly lesson notes, digital learning materials, conflict-free timetable scheduling, daily classroom attendance registers, and real-time SMS notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Classes Overview */}
      <section id="curriculum" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-blue uppercase font-bold text-xs tracking-wider">
              Academic Offerings
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy mt-1">
              Standard Primary Curriculum in Calabar
            </h2>
            <p className="text-slate-500 text-xs mt-2">
              Comprehensive subjects approved for Primary 1 through Primary 6 and Early Childhood Development.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {[
              { code: 'ENG', title: 'English Studies', desc: 'Phonics & Composition' },
              { code: 'MTH', title: 'Mathematics', desc: 'Arithmetic & Shapes' },
              { code: 'BST', title: 'Basic Science', desc: 'Living Things & Energy' },
              { code: 'NVSS', title: 'National Values', desc: 'Social & Civic Studies' },
              { code: 'CRS', title: 'Christian Studies', desc: 'Biblical Knowledge' },
              { code: 'HAU', title: 'Hausa Language', desc: 'Language & Culture' },
              { code: 'AGR', title: 'Agricultural Science', desc: 'Practical Farming' },
              { code: 'ICT', title: 'Computer Studies', desc: 'Digital Literacy' },
              { code: 'QTR', title: 'Quantitative Reasoning', desc: 'Pattern Logic' },
              { code: 'VBR', title: 'Verbal Reasoning', desc: 'Word Associations' },
            ].map((sub, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <span className="text-xs font-black text-brand-blue">{sub.code}</span>
                <div className="font-bold text-slate-900 mt-1">{sub.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{sub.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy text-white pt-12 pb-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-white/10">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-amber text-brand-navy flex items-center justify-center font-bold text-lg">
                  F
                </div>
                <span className="font-black text-base">{school.name}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                "{school.motto}". Providing premier primary school education and holistic character development in Calabar, Cross River State, Nigeria.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-amber-400 uppercase tracking-wider mb-3">Portal Access</h4>
              <ul className="space-y-2 text-slate-300">
                <li><Link to="/login" className="hover:text-white font-semibold">Staff & Parent Single Sign-On</Link></li>
                <li><a href="#curriculum" className="hover:text-white">Curriculum & Subjects</a></li>
                <li><a href="#features" className="hover:text-white">School Management Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-amber-400 uppercase tracking-wider mb-3">School Bursary & Administration</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center space-x-2">
                  <MapPin size={14} className="text-brand-amber flex-shrink-0" />
                  <span>{school.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={14} className="text-brand-amber flex-shrink-0" />
                  <span className="font-mono">{school.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail size={14} className="text-brand-amber flex-shrink-0" />
                  <span>{school.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
            <div>
              © {new Date().getFullYear()} {school.name}, Calabar, Cross River State, Nigeria. All rights reserved.
            </div>
            <div className="text-slate-500">
              Official School Management Portal
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
