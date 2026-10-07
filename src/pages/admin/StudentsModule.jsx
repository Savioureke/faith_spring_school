import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Users, UserPlus, Search, Filter, Download, Upload, 
  Edit, Trash2, CheckCircle, AlertCircle, FileText, Camera, RefreshCw,
  Lock, KeyRound, Eye, EyeOff
} from 'lucide-react';

const StudentsModule = () => {
  const { classes, showToast } = useSchool();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPortalPass, setShowPortalPass] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    other_names: '',
    gender: 'Male',
    date_of_birth: '2018-05-15',
    class_id: '',
    blood_group: 'O+',
    genotype: 'AA',
    state_of_origin: 'Plateau',
    lga: 'Bokkos',
    home_address: '',
    medical_conditions: '',
    guardian_name: '',
    guardian_relationship: 'Father',
    guardian_phone: '',
    guardian_email: '',
    guardian_address: '',
    portal_password: 'password123',
  });

  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (id, name, arm),
          student_guardians (
            guardians (id, full_name, phone, relationship, email, portal_password)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      showToast('Error loading student records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !classFilter || s.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleOpenCreate = () => {
    setEditingStudent(null);
    const year = new Date().getFullYear();
    const nextSeq = String(students.length + 1).padStart(3, '0');
    setFormData({
      admission_number: `EAF/${year}/${nextSeq}`,
      first_name: '',
      last_name: '',
      other_names: '',
      gender: 'Male',
      date_of_birth: '2018-05-15',
      class_id: classes[0]?.id || '',
      blood_group: 'O+',
      genotype: 'AA',
      state_of_origin: 'Plateau',
      lga: 'Bokkos',
      home_address: '',
      medical_conditions: '',
      guardian_name: '',
      guardian_relationship: 'Father',
      guardian_phone: '',
      guardian_email: '',
      guardian_address: '',
      portal_password: 'password123',
    });
    setShowPortalPass(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    const primaryG = student.student_guardians?.[0]?.guardians;
    setFormData({
      admission_number: student.admission_number || '',
      first_name: student.first_name,
      last_name: student.last_name,
      other_names: student.other_names || '',
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      class_id: student.class_id || '',
      blood_group: student.blood_group || 'O+',
      genotype: student.genotype || 'AA',
      state_of_origin: student.state_of_origin || 'Plateau',
      lga: student.lga || 'Bokkos',
      home_address: student.home_address || '',
      medical_conditions: student.medical_conditions || '',
      guardian_name: primaryG?.full_name || '',
      guardian_relationship: primaryG?.relationship || 'Father',
      guardian_phone: primaryG?.phone || '',
      guardian_email: primaryG?.email || '',
      guardian_address: primaryG?.home_address || '',
      portal_password: student.portal_password || primaryG?.portal_password || 'password123',
    });
    setShowPortalPass(false);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);

    const year = new Date().getFullYear();
    const nextSeq = String(students.length + 1).padStart(3, '0');
    const admission_number = (formData.admission_number || '').trim() || `EAF/${year}/${nextSeq}`;
    const portalPassword = (formData.portal_password || '').trim() || 'password123';

    try {
      if (editingStudent) {
        // Update student
        const { error } = await supabase
          .from('students')
          .update({
            admission_number,
            first_name: formData.first_name,
            last_name: formData.last_name,
            other_names: formData.other_names,
            gender: formData.gender,
            date_of_birth: formData.date_of_birth,
            class_id: formData.class_id,
            blood_group: formData.blood_group,
            genotype: formData.genotype,
            state_of_origin: formData.state_of_origin,
            lga: formData.lga,
            home_address: formData.home_address,
            medical_conditions: formData.medical_conditions,
            portal_password: portalPassword,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStudent.id);

        if (error) throw error;

        // Update guardian record if linked
        const primaryG = editingStudent.student_guardians?.[0]?.guardians;
        if (primaryG) {
          await supabase
            .from('guardians')
            .update({
              full_name: formData.guardian_name,
              relationship: formData.guardian_relationship,
              phone: formData.guardian_phone,
              email: formData.guardian_email,
              home_address: formData.guardian_address || formData.home_address,
              portal_password: portalPassword,
            })
            .eq('id', primaryG.id);
        } else if (formData.guardian_name && formData.guardian_phone) {
          const { data: newGuardian } = await supabase
            .from('guardians')
            .insert({
              full_name: formData.guardian_name,
              relationship: formData.guardian_relationship,
              phone: formData.guardian_phone,
              email: formData.guardian_email,
              home_address: formData.guardian_address || formData.home_address,
              portal_password: portalPassword,
            })
            .select()
            .single();

          if (newGuardian) {
            await supabase.from('student_guardians').insert({
              student_id: editingStudent.id,
              guardian_id: newGuardian.id,
              is_primary: true
            });
          }
        }

        // Sync pupil auth user
        const studentEmail = editingStudent.email || `${formData.first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${formData.last_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.faithspringschool.ng`;
        try {
          await supabase.rpc('register_portal_user', {
            p_email: studentEmail,
            p_password: portalPassword,
            p_role: 'student',
            p_full_name: `${formData.first_name} ${formData.last_name}`,
            p_phone: formData.guardian_phone
          });
        } catch (authErr) {
          console.warn('Pupil auth sync notice:', authErr);
        }

        // Sync parent auth user
        if (formData.guardian_email) {
          try {
            await supabase.rpc('register_portal_user', {
              p_email: formData.guardian_email,
              p_password: portalPassword,
              p_role: 'parent',
              p_full_name: formData.guardian_name,
              p_phone: formData.guardian_phone
            });
          } catch (authErr) {
            console.warn('Parent auth sync notice:', authErr);
          }
        }

        showToast(`Pupil record updated! Login ID: ${admission_number}`);
      } else {
        const studentEmail = `${formData.first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${formData.last_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.faithspringschool.ng`;

        // 1. Insert student
        const { data: newStudent, error: sErr } = await supabase
          .from('students')
          .insert({
            admission_number,
            first_name: formData.first_name,
            last_name: formData.last_name,
            other_names: formData.other_names,
            gender: formData.gender,
            date_of_birth: formData.date_of_birth,
            class_id: formData.class_id,
            blood_group: formData.blood_group,
            genotype: formData.genotype,
            state_of_origin: formData.state_of_origin,
            lga: formData.lga,
            home_address: formData.home_address,
            medical_conditions: formData.medical_conditions,
            passport_url: '/img/student-icon.png',
            portal_password: portalPassword,
          })
          .select()
          .single();

        if (sErr) throw sErr;

        // Sync pupil auth user
        try {
          await supabase.rpc('register_portal_user', {
            p_email: studentEmail,
            p_password: portalPassword,
            p_role: 'student',
            p_full_name: `${formData.first_name} ${formData.last_name}`,
            p_phone: formData.guardian_phone
          });
        } catch (authErr) {
          console.warn('Pupil auth sync notice:', authErr);
        }

        // 2. Insert guardian if provided
        if (formData.guardian_name && formData.guardian_phone) {
          const { data: newGuardian } = await supabase
            .from('guardians')
            .insert({
              full_name: formData.guardian_name,
              relationship: formData.guardian_relationship,
              phone: formData.guardian_phone,
              email: formData.guardian_email,
              home_address: formData.guardian_address || formData.home_address,
              portal_password: portalPassword,
            })
            .select()
            .single();

          if (newGuardian && newStudent) {
            await supabase.from('student_guardians').insert({
              student_id: newStudent.id,
              guardian_id: newGuardian.id,
              is_primary: true
            });
          }

          if (formData.guardian_email) {
            try {
              await supabase.rpc('register_portal_user', {
                p_email: formData.guardian_email,
                p_password: portalPassword,
                p_role: 'parent',
                p_full_name: formData.guardian_name,
                p_phone: formData.guardian_phone
              });
            } catch (authErr) {
              console.warn('Parent auth sync notice:', authErr);
            }
          }
        }

        showToast(`Pupil enrolled! Login ID: ${admission_number} • Password: ${portalPassword}`);
      }

      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      showToast(err.message || 'Failed to save student', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove pupil ${name}? This will delete associated scores and invoices.`)) {
      return;
    }
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      showToast('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Admission Number,First Name,Last Name,Class,Gender,State,LGA,Parent Phone'];
    const rows = filteredStudents.map(s => {
      const parentPhone = s.student_guardians?.[0]?.guardians?.phone || '';
      const className = s.classes ? `${s.classes.name} ${s.classes.arm}` : '';
      return `"${s.admission_number}","${s.first_name}","${s.last_name}","${className}","${s.gender}","${s.state_of_origin}","${s.lga}","${parentPhone}"`;
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faith_Spring_School_Students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Students & Enrollment Module</h1>
          <p className="text-xs text-slate-500">
            Pupil registry, bio-data, guardian contacts, and admission records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 transition-all"
          >
            <UserPlus size={16} />
            <span>Admit New Pupil</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or admission no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
            ))}
          </select>
          <button onClick={fetchStudents} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-brand-blue" />
            <p className="text-xs">Loading pupil directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-600">No students found</p>
            <p className="text-xs mt-1">Try adjusting your filters or click "Admit New Pupil" to enroll one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Pupil</th>
                  <th className="py-3.5 px-3">Admission No</th>
                  <th className="py-3.5 px-3">Class</th>
                  <th className="py-3.5 px-3">Gender / Age</th>
                  <th className="py-3.5 px-3">Parent / Phone</th>
                  <th className="py-3.5 px-3">LGA / State</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map(student => {
                  const guardian = student.student_guardians?.[0]?.guardians;
                  const birthYear = student.date_of_birth ? new Date(student.date_of_birth).getFullYear() : 2018;
                  const age = new Date().getFullYear() - birthYear;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-brand-soft/50 text-brand-blue flex items-center justify-center font-bold text-xs">
                            {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-[10px] text-slate-400">{student.other_names || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-blue">
                        {student.admission_number}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-brand-blue border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          {student.classes ? `${student.classes.name} ${student.classes.arm}` : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {student.gender} • {age} yrs
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{guardian?.full_name || 'Not Recorded'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{guardian?.phone || '-'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {student.lga}, {student.state_of_origin}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-brand-blue"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Enrollment / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingStudent ? 'Edit Pupil Bio-Data' : 'New Pupil Admission & Enrollment'}
                </h3>
                <p className="text-xs text-slate-300">
                  Fill in standard pupil biodata and parent/guardian contact details
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <h4 className="font-bold text-brand-navy uppercase tracking-wider text-[11px] border-b pb-1">
                Pupil Bio-Data
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Last Name / Surname *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Other Names</label>
                  <input
                    type="text"
                    value={formData.other_names}
                    onChange={(e) => setFormData({ ...formData, other_names: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class Placement *</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender *</label>
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
                  <label className="block text-slate-700 font-bold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Genotype</label>
                  <select
                    value={formData.genotype}
                    onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">State of Origin</label>
                  <input
                    type="text"
                    value={formData.state_of_origin}
                    onChange={(e) => setFormData({ ...formData, state_of_origin: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">LGA</label>
                  <input
                    type="text"
                    value={formData.lga}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. Fwangnin Village, Bokkos"
                  value={formData.home_address}
                  onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <h4 className="font-bold text-brand-navy uppercase tracking-wider text-[11px] border-b pb-1 pt-2">
                Parent / Guardian Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Parent Full Name</label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Relationship</label>
                  <select
                    value={formData.guardian_relationship}
                    onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Phone *</label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 803 123 4567"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Email</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.guardian_email}
                    onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Unified Student & Parent Portal Login Credentials */}
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-brand-navy font-bold text-xs uppercase tracking-wider">
                    <KeyRound size={15} className="text-brand-blue" />
                    <span>Portal Login Credentials (Pupil & Parent Shared Login)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                    Single Shared Login
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Both the pupil and parent use this single Admission Number and Password to access terminal results, CBT exams, and fee payments at <span className="font-bold text-brand-navy">/login</span>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center justify-between">
                      <span>Admission Number (Login ID) *</span>
                      <span className="text-[10px] text-slate-500 font-normal">Auto-assigned</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EAF/2026/001"
                      value={formData.admission_number}
                      onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold tracking-wide bg-white focus:ring-2 focus:ring-brand-blue"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Entered in the "Admission Number or Email" field at login.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Lock size={12} className="text-brand-blue" />
                        <span>Portal Password *</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">Min 6 characters</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPortalPass ? 'text' : 'password'}
                        required
                        placeholder="e.g. password123"
                        value={formData.portal_password}
                        onChange={(e) => setFormData({ ...formData, portal_password: e.target.value })}
                        className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-brand-blue"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPortalPass(!showPortalPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPortalPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Shared password used by pupil and parent to sign into the portal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold shadow-md shadow-brand-blue/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingStudent ? 'Update Pupil Record' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsModule;
