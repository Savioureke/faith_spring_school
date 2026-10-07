import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  BookOpen, Plus, Download, FileText, Video, Image, 
  ExternalLink, Trash2, RefreshCw 
} from 'lucide-react';

const ELearningAdmin = () => {
  const { classes, subjects, activeTerm, showToast } = useSchool();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [resClassId, setResClassId] = useState('');
  const [resSubjectId, setResSubjectId] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resType, setResType] = useState('lesson_note');
  const [resUrl, setResUrl] = useState('');
  const [resWeek, setResWeek] = useState(1);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('elearning_resources')
        .select(`
          *,
          classes (name, arm),
          subjects (name, code),
          teachers (full_name)
        `)
        .order('week_number', { ascending: true });

      if (error) throw error;
      setResources(data || []);

      if (classes.length > 0 && !resClassId) setResClassId(classes[0].id);
      if (subjects.length > 0 && !resSubjectId) setResSubjectId(subjects[0].id);
    } catch (err) {
      console.error(err);
      showToast('Error loading e-learning resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [classes, subjects]);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!resClassId || !resSubjectId || !activeTerm.id) return;

    try {
      const { error } = await supabase.from('elearning_resources').insert({
        term_id: activeTerm.id,
        class_id: resClassId,
        subject_id: resSubjectId,
        title: resTitle,
        description: resDesc,
        week_number: Number(resWeek),
        resource_type: resType,
        file_url: resUrl || 'https://faithspringschool.sch.ng/materials/sample.pdf'
      });

      if (error) throw error;
      showToast('Learning material uploaded successfully');
      setIsModalOpen(false);
      fetchResources();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete learning resource?')) return;
    try {
      const { error } = await supabase.from('elearning_resources').delete().eq('id', id);
      if (error) throw error;
      showToast('Resource deleted');
      fetchResources();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">E-Learning & Study Materials</h1>
          <p className="text-xs text-slate-500">
            Lesson notes, study guides, and multimedia learning uploads by class and topic
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold shadow-md w-fit"
        >
          <Plus size={16} />
          <span>Upload Material</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(res => (
          <div key={res.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-brand-blue px-2 py-0.5 rounded">
                  Week {res.week_number} • {res.resource_type.replace('_', ' ')}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {res.classes?.name} {res.classes?.arm}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{res.title}</h3>
              <p className="text-slate-500 text-xs mt-1">{res.description || 'Lesson notes and exercises'}</p>
              <div className="text-[11px] text-brand-blue font-semibold mt-2">
                Subject: {res.subjects?.name} ({res.subjects?.code})
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <a
                href={res.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-xs font-bold text-brand-blue hover:underline"
              >
                <Download size={13} />
                <span>Download / Open</span>
              </a>
              <button
                onClick={() => handleDelete(res.id)}
                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Upload E-Learning Material</h3>
            <form onSubmit={handleCreateResource} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class</label>
                  <select
                    value={resClassId}
                    onChange={(e) => setResClassId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject</label>
                  <select
                    value={resSubjectId}
                    onChange={(e) => setResSubjectId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Curriculum Week</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={resWeek}
                    onChange={(e) => setResWeek(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Material Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="lesson_note">Lesson Note</option>
                    <option value="document">Document / PDF</option>
                    <option value="image">Diagram / Image</option>
                    <option value="video_link">Video Lesson Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Topic / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 4: Plant Parts and Photosynthesis"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Summary notes for pupils..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Resource URL / Link</label>
                <input
                  type="url"
                  placeholder="https://... (or leave empty for default document)"
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue text-white rounded-xl font-bold"
                >
                  Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ELearningAdmin;
