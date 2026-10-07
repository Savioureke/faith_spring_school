import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Users, UserPlus, Search, Edit, Trash2, CheckCircle, 
  Briefcase, BookOpen, Layers, Phone, Mail, Award, RefreshCw,
  Lock, KeyRound, Eye, EyeOff
} from 'lucide-react';

const TeachersModule = () => {
  const { classes, subjects, activeTerm, showToast } = useSchool();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'Male',
    email: '',
    phone: '',
    qualification: 'B.Ed',
    specialization: '',
    status: 'active',
    password: 'password123',
  });

  // Assignment state
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          classes:classes(id, name, arm),
          teacher_assignments(
            id,
            class_id,
            subject_id,
            classes(name, arm),
            subjects(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      showToast('Error loading teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedTeacher(null);
    setFormData({
      full_name: '',
      gender: 'Male',
      email: '',
      phone: '',
      qualification: 'B.Ed',
      specialization: '',
      status: 'active',
      password: 'password123',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setSelectedTeacher(t);
    setFormData({
      full_name: t.full_name,
      gender: t.gender || 'Male',
      email: t.email || '',
      phone: t.phone || '',
      qualification: t.qualification || 'B.Ed',
      specialization: t.specialization || '',
      status: t.status || 'active',
      password: t.portal_password || 'password123',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenAssign = (t) => {
    setSelectedTeacher(t);
    setAssignClassId(classes[0]?.id || '');
    setAssignSubjectId(subjects[0]?.id || '');
    setTeacherAssignments(t.teacher_assignments || []);
    setIsAssignModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    setSaving(true);

    const teacherPassword = formData.password?.trim() || 'password123';
    let teacherEmail = formData.email?.trim();
    if (!teacherEmail) {
      const nameParts = formData.full_name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
      teacherEmail = nameParts.length >= 2 
        ? `${nameParts[0]}.${nameParts[nameParts.length - 1]}@faithspringschool.sch.ng`
        : `teacher.${Date.now().toString().slice(-4)}@faithspringschool.sch.ng`;
    }

    try {
      // Provision/sync with auth & profiles
      try {
        await supabase.rpc('register_portal_user', {
          p_email: teacherEmail,
          p_password: teacherPassword,
          p_role: 'teacher',
          p_full_name: formData.full_name,
          p_phone: formData.phone
        });
      } catch (authErr) {
        console.warn('Teacher RPC sync notice:', authErr);
      }

      if (selectedTeacher) {
        const { error } = await supabase
          .from('teachers')
          .update({
            full_name: formData.full_name,
            gender: formData.gender,
            email: teacherEmail,
            phone: formData.phone,
            qualification: formData.qualification,
            specialization: formData.specialization,
            status: formData.status,
            portal_password: teacherPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTeacher.id);

        if (error) throw error;
        showToast('Teacher record updated with portal credentials');
      } else {
        const staff_id = `FSS/T/${String(teachers.length + 1).padStart(3, '0')}`;
        const { error } = await supabase
          .from('teachers')
          .insert({
            staff_id,
            full_name: formData.full_name,
            gender: formData.gender,
            email: teacherEmail,
            phone: formData.phone,
            qualification: formData.qualification,
            specialization: formData.specialization,
            status: formData.status,
            portal_password: teacherPassword
          });

        if (error) throw error;
        showToast(`Teacher registered! Staff ID: ${staff_id} • Password: ${teacherPassword}`);
      }

      setIsModalOpen(false);
      fetchTeachers();
    } catch (err) {
      showToast(err.message || 'Error saving teacher', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !assignClassId || !assignSubjectId || !activeTerm.id) return;

    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .insert({
          teacher_id: selectedTeacher.id,
          class_id: assignClassId,
          subject_id: assignSubjectId,
          term_id: activeTerm.id
        });

      if (error) {
        if (error.code === '23505') {
          showToast('This teacher is already assigned to this subject and class', 'error');
          return;
        }
        throw error;
      }

      showToast('Subject assigned to teacher successfully');
      fetchTeachers();
      setIsAssignModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher record for ${name}?`)) return;
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      showToast('Teacher record deleted');
      fetchTeachers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    `${t.full_name} ${t.staff_id} ${t.specialization}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Teachers & Staff Module</h1>
          <p className="text-xs text-slate-500">
            Staff records, academic qualifications, class teachers, and subject allocations
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 transition-all w-fit"
        >
          <UserPlus size={16} />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers by name or staff ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <button onClick={fetchTeachers} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-brand-blue" />
          <p className="text-xs">Loading staff records...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-600">No teachers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:border-brand-blue/40 transition-all">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base">
                      {teacher.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{teacher.full_name}</h3>
                      <span className="font-mono text-[11px] font-bold text-brand-blue">{teacher.staff_id}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    teacher.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {teacher.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Award size={13} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{teacher.qualification || 'NCE / B.Ed'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase size={13} className="text-slate-400" />
                    <span>{teacher.specialization || 'General Studies'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-mono text-[11px]">{teacher.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{teacher.email || 'No email'}</span>
                  </div>
                </div>

                {/* Assigned subjects */}
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Assigned Subjects</span>
                    <span>{teacher.teacher_assignments?.length || 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teacher.teacher_assignments && teacher.teacher_assignments.length > 0 ? (
                      teacher.teacher_assignments.map((asgn, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-blue-50 text-brand-blue border border-blue-200 px-2 py-0.5 rounded-md">
                          {asgn.subjects?.code} ({asgn.classes?.name} {asgn.classes?.arm})
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No subjects allocated yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenAssign(teacher)}
                  className="flex items-center space-x-1 text-xs font-bold text-brand-blue hover:text-brand-blue-hover"
                >
                  <BookOpen size={13} />
                  <span>Assign Subject</span>
                </button>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(teacher)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-brand-blue"
                    title="Edit Record"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id, teacher.full_name)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                    title="Delete Teacher"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {selectedTeacher ? 'Edit Teacher Record' : 'Register New Academic Staff'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name (with Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Dung Pam Gyang"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Sc. Ed, TRCN"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics & Quantitative Reasoning"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 111 2233"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="teacher@faithspringschool.ng"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Teacher Portal Password */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center space-x-1.5 text-slate-800">
                    <Lock size={14} className="text-brand-blue" />
                    <span>Portal Login Password *</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Used to sign in at /teachers</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="e.g. password123 (minimum 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 pr-10 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-blue bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  The teacher will use this password alongside their email or Staff ID to log in to the Teacher Workspace.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold"
                >
                  {saving ? 'Saving...' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Assign Subject & Class</h3>
                <p className="text-[11px] text-slate-300">{selectedTeacher.full_name}</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddAssignment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Class *</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Subject *</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersModule;
