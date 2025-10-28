import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Eye, RefreshCw, X } from 'lucide-react';
import { WAApi } from '../../api/whatsapp.api';
import CreateTemplateModal from './CreateTemplateModal';

export const TemplatesTab = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en',
    parameter_format: 'POSITIONAL',
    bodyText: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { responseObject } = await WAApi.getTemplatesList();
      setTemplates(responseObject?.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        category: formData.category,
        language: formData.language,
        parameter_format: formData.parameter_format,
        components: [
          {
            type: 'BODY',
            text: formData.bodyText.trim(),
          },
        ],
      };

      const res = await WAApi.createTemplate(payload);

      if (res?.status === 200 || res?.status === 201) {
        alert('✅ Template created successfully!');
        setShowModal(false);
        setFormData({
          name: '',
          category: 'MARKETING',
          language: 'en',
          parameter_format: 'POSITIONAL',
          bodyText: '',
        });
        fetchTemplates();
      } else {
        alert(`❌ Failed to create template: ${res?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Failed to create template. Check console for details.');
    } finally {
      setCreating(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-700';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const openPreview = (template: any) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchTemplates}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync with Meta'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Language</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <motion.tr key={template.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td className="px-6 py-4 font-medium text-gray-900">{template.name}</td>
                <td className="px-6 py-4 text-gray-700">{template.language}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {template.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(template.status)}`}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openPreview(template)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Template Modal */}
      <AnimatePresence>
        <AnimatePresence>
  {showModal && (
    <CreateTemplateModal
      show={showModal}
      setShow={setShowModal}
      onSuccess={fetchTemplates} // refresh templates after creation
    />
  )}
</AnimatePresence>
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Template Preview</h3>
                <button onClick={() => setShowPreview(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-1">{previewTemplate.name}</p>
                <p className="text-gray-700 mb-4">
                  {previewTemplate.language} • {previewTemplate.category}
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 whitespace-pre-wrap">
                  {previewTemplate.components?.find((c: any) => c.type === 'BODY')?.text}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
