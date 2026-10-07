import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SchoolContext = createContext(null);

export const SchoolProvider = ({ children }) => {
  const [school, setSchool] = useState({
    name: 'Faith Spring School',
    code: 'FSS',
    motto: 'Excellence, Character and Knowledge',
    address: 'Calabar, Cross River State, Nigeria',
    phone: '+234 803 456 7890',
    email: 'admin@faithspringschool.sch.ng',
    logo_url: '/img/logo.png',
  });

  const [activeSession, setActiveSession] = useState({
    id: null,
    name: '2026/2027',
    is_current: true,
  });

  const [activeTerm, setActiveTerm] = useState({
    id: null,
    name: 'First Term',
    term_number: 1,
    is_current: true,
    next_term_begins: '2027-01-11'
  });

  const [allSessions, setAllSessions] = useState([]);
  const [allTerms, setAllTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const refreshSchoolData = async () => {
    try {
      const { data: schoolData } = await supabase.from('schools').select('*').limit(1).single();
      if (schoolData) setSchool(schoolData);

      // Fetch all sessions
      const { data: sessionsData } = await supabase
        .from('academic_sessions')
        .select('*')
        .order('start_date', { ascending: false });
      if (sessionsData) setAllSessions(sessionsData);

      // Fetch all terms
      const { data: termsData } = await supabase
        .from('terms')
        .select('*, academic_sessions(name)')
        .order('term_number', { ascending: true });
      if (termsData) setAllTerms(termsData);

      // Determine active session & term from localStorage or database is_current
      const savedTermId = localStorage.getItem('fss_scoped_term_id');
      let targetTerm = null;

      if (savedTermId && termsData) {
        targetTerm = termsData.find(t => t.id === savedTermId);
      }
      if (!targetTerm && termsData) {
        targetTerm = termsData.find(t => t.is_current) || termsData[0];
      }

      if (targetTerm) {
        setActiveTerm(targetTerm);
        const parentSession = sessionsData?.find(s => s.id === targetTerm.session_id) || { name: '2026/2027' };
        setActiveSession(parentSession);
      }

      const { data: classData } = await supabase.from('classes').select('*').order('numeric_level');
      if (classData) setClasses(classData);

      const { data: subjectData } = await supabase.from('subjects').select('*').order('name');
      if (subjectData) setSubjects(subjectData);
    } catch (err) {
      console.error('Error fetching school metadata:', err);
    }
  };

  // Scope entire portal to a selected term
  const setScopedTerm = (termId) => {
    const foundTerm = allTerms.find(t => t.id === termId);
    if (foundTerm) {
      setActiveTerm(foundTerm);
      localStorage.setItem('fss_scoped_term_id', termId);
      const parentSession = allSessions.find(s => s.id === foundTerm.session_id);
      if (parentSession) setActiveSession(parentSession);
      showToast(`Switched active portal view to: ${parentSession?.name || ''} ${foundTerm.name}`);
    }
  };

  // Create new session with 3 terms
  const createAcademicSession = async (sessionName, startDate, endDate) => {
    try {
      const { data: newSession, error: sErr } = await supabase
        .from('academic_sessions')
        .insert({
          name: sessionName,
          start_date: startDate,
          end_date: endDate,
          is_current: false,
        })
        .select()
        .single();

      if (sErr) throw sErr;

      // Auto-create 3 terms
      const termsToCreate = [
        { session_id: newSession.id, name: 'First Term', term_number: 1, start_date: startDate, end_date: endDate, is_current: false },
        { session_id: newSession.id, name: 'Second Term', term_number: 2, start_date: startDate, end_date: endDate, is_current: false },
        { session_id: newSession.id, name: 'Third Term', term_number: 3, start_date: startDate, end_date: endDate, is_current: false },
      ];

      await supabase.from('terms').insert(termsToCreate);

      showToast(`Academic session ${sessionName} created with 3 terms!`);
      await refreshSchoolData();
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    refreshSchoolData();
  }, []);

  return (
    <SchoolContext.Provider value={{
      school,
      activeSession,
      activeTerm,
      allSessions,
      allTerms,
      classes,
      subjects,
      refreshSchoolData,
      setScopedTerm,
      createAcademicSession,
      toast,
      showToast,
    }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 text-white font-medium text-sm animate-bounce"
             style={{
               backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0062ff' : '#10b981'
             }}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 font-bold opacity-80 hover:opacity-100">&times;</button>
        </div>
      )}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
