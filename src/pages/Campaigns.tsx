import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, Play, Pause, Trash2, Archive, Eye, X, 
  Send, BarChart3, Clock, CheckCircle, XCircle, Users, 
  FileText, Edit, AlertCircle 
} from 'lucide-react';
import { WAApi } from '../api/whatsapp.api';
import { toast } from 'react-hot-toast';

type Tab = 'active' | 'archived';

interface Campaign {
  id: number;
  title: string;
  templateName: string;
  languageCode: string;
  templateMeta: any;
  components: any[];
  contactIds: number[];
  contactCount: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  messagesSent: number;
  messagesFailed: number;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  status: string;
  language: string;
  category: string;
  components: any[];
  parameter_format?: string;
}

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
}

export const Campaigns = () => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    templateName: '',
    languageCode: 'en_US',
    templateMeta: null as any,
    components: [] as any[],
    contactIds: [] as number[],
    scheduledAt: '',
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchContacts();
  }, [activeTab, page]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'active' 
        ? undefined 
        : activeTab === 'archived' ? 'completed' : undefined;
      
      const {responseObject} = await WAApi.Campaign.list(page, 10, status);
      if (responseObject.data) {
        const filteredCampaigns = responseObject?.data?.filter((c: Campaign) => {
          if (activeTab === 'active') {
            return ['draft', 'scheduled', 'running', 'paused'].includes(c.status);
          } else {
            return ['completed', 'failed'].includes(c.status);
          }
        });
        setCampaigns(filteredCampaigns);
        setTotalCampaigns(responseObject.total);
      }
    } catch (error: any) {
      // toast.error(error?.response?.data?.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const {responseObject} = await WAApi.getTemplatesList();
      if (responseObject.data) {
        const approvedTemplates = responseObject?.data?.filter((t: any) => t.status === 'APPROVED');
        setTemplates(approvedTemplates);
      }
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const resp= await WAApi.fetchContactsList(1, 1000);
      if (resp.contacts) {
        setContacts(resp.contacts || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const handleTemplateChange = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      // Initialize components with empty parameters based on template structure
      const initialComponents = template.components.map((comp: any) => {
        // Handle BODY component with placeholders
        if (comp.type === 'BODY' && comp.text) {
          const placeholderCount = (comp.text.match(/\{\{(\d+)\}\}/g) || []).length;
          return {
            type: 'BODY',
            parameters: Array(placeholderCount).fill(null).map(() => ({ type: 'text', text: '' }))
          };
        }
        
        // Handle HEADER component with placeholders
        if (comp.type === 'HEADER') {
          if (comp.format === 'TEXT' && comp.text) {
            const placeholderCount = (comp.text.match(/\{\{(\d+)\}\}/g) || []).length;
            if (placeholderCount > 0) {
              return {
                type: 'HEADER',
                parameters: Array(placeholderCount).fill(null).map(() => ({ type: 'text', text: '' }))
              };
            }
          }
          // For IMAGE, VIDEO, DOCUMENT headers
          if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format)) {
            return {
              type: 'HEADER',
              parameters: [{
                type: comp.format.toLowerCase(),
                [comp.format.toLowerCase()]: { link: '' }
              }]
            };
          }
        }
        
        // Handle BUTTONS - convert to BUTTON (singular) for each button
        if (comp.type === 'BUTTONS' && comp.buttons) {
          // Return array of BUTTON components (one for each button)
          return comp.buttons.map((button: any, index: number) => {
            if (button.type === 'URL' && button.url?.includes('{{1}}')) {
              // Dynamic URL button
              return {
                type: 'BUTTON',
                sub_type: 'URL',
                index: index.toString(),
                parameters: [{ type: 'text', text: '' }]
              };
            }
            return null;
          }).filter(Boolean);
        }
        
        // Skip FOOTER and static components (no parameters needed)
        return null;
      }).flat().filter(Boolean);

      setFormData({
        ...formData,
        templateName: template.name,
        languageCode: template.language,
        templateMeta: template,
        components: initialComponents,
      });
    }
  };

  const updateComponentParameter = (compIndex: number, paramIndex: number, value: string) => {
    const newComponents = [...formData.components];
    if (!newComponents[compIndex].parameters) {
      newComponents[compIndex].parameters = [];
    }
    newComponents[compIndex].parameters[paramIndex] = {
      type: 'text',
      text: value,
    };
    setFormData({ ...formData, components: newComponents });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.contactIds.length === 0) {
        toast.error('Please select at least one contact');
        setLoading(false);
        return;
      }

      if (!formData.templateName) {
        toast.error('Please select a template');
        setLoading(false);
        return;
      }
      const utcTime = new Date(formData.scheduledAt).toISOString();

      const payload = {
        title: formData.title,
        templateName: formData.templateName,
        languageCode: formData.languageCode,
        templateMeta: formData.templateMeta,
        components: formData.components,
        contactIds: formData.contactIds,
        scheduledAt: utcTime || null,
      };

      if (editingCampaign) {
        const {success} = await WAApi.Campaign.update(editingCampaign.id, payload);
        if (success) {
          toast.success('Campaign updated successfully');
          fetchCampaigns();
        }
      } else {
        const {success} = await WAApi.Campaign.create(payload);
        if (success) {
          toast.success('Campaign created successfully');
          fetchCampaigns();
        }
      }

      setShowModal(false);
      setEditingCampaign(null);
      resetForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setLoading(true);
      try {
        const {success} = await WAApi.Campaign.delete(campaignId);
        if (success) {
          toast.success('Campaign deleted successfully');
          fetchCampaigns();
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to delete campaign');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendNow = async (campaignId: number) => {
    if (confirm('Send this campaign immediately to all contacts?')) {
      setLoading(true);
      try {
        const {success} = await WAApi.Campaign.send(campaignId);
        if (success) {
          toast.success('Campaign started successfully');
          fetchCampaigns();
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to send campaign');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePause = async (campaignId: number) => {
    setLoading(true);
    try {
      const response = await WAApi.Campaign.pause(campaignId);
      if (response.success) {
        toast.success('Campaign paused successfully');
        fetchCampaigns();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to pause campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (campaignId: number) => {
    setLoading(true);
    try {
      const response = await WAApi.Campaign.resume(campaignId);
      if (response.success) {
        toast.success('Campaign resumed successfully');
        fetchCampaigns();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to resume campaign');
    } finally {
      setLoading(false);
    }
  };

  const openStatsModal = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowStatsModal(true);
    setLoading(true);
    try {
      const response = await WAApi.Campaign.stats(campaign.id);
      if (response.success) {
        setCampaignStats(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch campaign stats');
    } finally {
      setLoading(false);
    }
  };

  const openLogsModal = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowLogsModal(true);
    setLoading(true);
    try {
      const response = await WAApi.Campaign.logs(campaign.id, 1, 100);
      if (response.success) {
        setCampaignLogs(response.responseObject.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch campaign logs');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      templateName: campaign.templateName,
      languageCode: campaign.languageCode,
      templateMeta: campaign.templateMeta,
      components: campaign.components,
      contactIds: campaign.contactIds,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingCampaign(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      templateName: '',
      languageCode: 'en_US',
      templateMeta: null,
      components: [],
      contactIds: [],
      scheduledAt: '',
    });
  };

  const toggleContact = (contactId: number) => {
    setFormData({
      ...formData,
      contactIds: formData.contactIds.includes(contactId)
        ? formData.contactIds.filter(id => id !== contactId)
        : [...formData.contactIds, contactId],
    });
  };

  const selectAllContacts = () => {
    setFormData({
      ...formData,
      contactIds: contacts.map(c => c.id),
    });
  };

  const deselectAllContacts = () => {
    setFormData({
      ...formData,
      contactIds: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'running':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'paused':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Create Campaign
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === 'active' ? 'text-emerald-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Campaigns
              {activeTab === 'active' && (
                <motion.div
                  layoutId="campaignTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === 'archived' ? 'text-emerald-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Archived Campaigns
              {activeTab === 'archived' && (
                <motion.div
                  layoutId="campaignTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6"
          >
            {loading && campaigns.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No campaigns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Template</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contacts</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Scheduled At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map((campaign) => (
                      <motion.tr
                        key={campaign.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{campaign.title}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          <div className="text-sm">
                            {campaign.templateName}
                            <span className="text-xs text-gray-500 ml-2">({campaign.languageCode})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{campaign.contactCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {campaign.status === 'running' || campaign.status === 'completed' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 font-medium">{campaign.messagesSent}</span>
                                {campaign.messagesFailed > 0 && (
                                  <>
                                    <XCircle className="w-4 h-4 text-red-500 ml-2" />
                                    <span className="text-red-600 font-medium">{campaign.messagesFailed}</span>
                                  </>
                                )}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${(campaign.messagesSent / campaign.contactCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {campaign.scheduledAt ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4" />
                              {new Date(campaign.scheduledAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true,
                              })}

                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Stats */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openStatsModal(campaign)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Stats"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </motion.button>

                            {/* View Logs */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openLogsModal(campaign)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Logs"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>

                            {/* Action Buttons */}
                            {campaign.status === 'draft' && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openEditModal(campaign)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleSendNow(campaign.id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Send Now"
                                >
                                  <Send className="w-4 h-4" />
                                </motion.button>
                              </>
                            )}

                            {campaign.status === 'running' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handlePause(campaign.id)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Pause"
                              >
                                <Pause className="w-4 h-4" />
                              </motion.button>
                            )}

                            {campaign.status === 'paused' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleResume(campaign.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Resume"
                              >
                                <Play className="w-4 h-4" />
                              </motion.button>
                            )}

                            {/* Delete */}
                            {['draft', 'paused', 'completed', 'failed'].includes(campaign.status) && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(campaign.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Pagination */}
      {totalCampaigns > 10 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {Math.ceil(totalCampaigns / 10)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(totalCampaigns / 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campaign Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., Diwali Offer Campaign"
                    required
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Template *
                  </label>
                  <select
                    value={formData.templateName}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.name}>
                        {template.name} ({template.language}) - {template.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Preview & Parameters */}
                {formData.templateMeta && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900">Template Preview</h4>
                    
                    {formData.templateMeta.components.map((comp: any, compIndex: number) => (
                      <div key={compIndex} className="space-y-2">
                        {comp.type === 'HEADER' && (
                          <div className="font-medium text-gray-900">{comp.text}</div>
                        )}
                        
                        {comp.type === 'BODY' && (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                              {comp.text}
                            </div>
                            
                            {/* Dynamic Parameter Inputs */}
                            {comp.text?.match(/\{\{(\d+)\}\}/g) && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Fill Template Parameters:
                                </label>
                                {comp.text.match(/\{\{(\d+)\}\}/g).map((_: any, paramIndex: number) => (
                                  <div key={paramIndex} className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 min-w-[80px]">
                                      Parameter {paramIndex + 1}:
                                    </span>
                                    <input
                                      type="text"
                                      value={formData.components[compIndex]?.parameters?.[paramIndex]?.text || ''}
                                      onChange={(e) => updateComponentParameter(compIndex, paramIndex, e.target.value)}
                                      placeholder={`Value for {{${paramIndex + 1}}}`}
                                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                      required
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {comp.type === 'FOOTER' && (
                          <div className="text-xs text-gray-500">{comp.text}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Contacts * ({formData.contactIds.length} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllContacts}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllContacts}
                        className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                    {contacts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No contacts available</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {contacts.map((contact) => (
                          <label
                            key={contact.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.contactIds.includes(contact.id)}
                              onChange={() => toggleContact(contact.id)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">{contact.name}</div>
                              <div className="text-xs text-gray-500 font-mono">{contact.phoneNumber}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Date/Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Campaign (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to save as draft. You can send it later manually.
                  </p>
                </div>

                {/* Summary */}
                {formData.contactIds.length > 0 && formData.templateName && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-emerald-900">Campaign Summary</p>
                        <p className="text-xs text-emerald-700">
                          This campaign will send the template "{formData.templateName}" to{' '}
                          <span className="font-semibold">{formData.contactIds.length} contacts</span>
                          {formData.scheduledAt && (
                            <> scheduled for{' '}
                              <span className="font-semibold">
                                {new Date(formData.scheduledAt).toLocaleString()}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || formData.contactIds.length === 0 || !formData.templateName}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && selectedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Campaign Statistics</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                </div>
              ) : campaignStats ? (
                <div className="space-y-6">
                  {/* Campaign Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{campaignStats.title}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaignStats.status)}`}>
                          {campaignStats.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Contacts:</span>
                        <span className="ml-2 font-semibold">{campaignStats.contactCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-700">{campaignStats.messagesSent}</div>
                      <div className="text-xs text-green-600">Messages Sent</div>
                    </div>

                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-red-700">{campaignStats.messagesFailed}</div>
                      <div className="text-xs text-red-600">Failed</div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{campaignStats.pending || 0}</div>
                      <div className="text-xs text-blue-600">Pending</div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-700">{campaignStats.successRate}%</div>
                      <div className="text-xs text-purple-600">Success Rate</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Overall Progress</span>
                      <span>{campaignStats.messagesSent} / {campaignStats.contactCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all"
                        style={{ 
                          width: `${(campaignStats.messagesSent / campaignStats.contactCount) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2 text-sm">
                    {campaignStats.scheduledAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Scheduled:</span>
                        <span className="font-medium">{new Date(campaignStats.scheduledAt).toLocaleString()}</span>
                      </div>
                    )}
                    {campaignStats.startedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Play className="w-4 h-4" />
                        <span>Started:</span>
                        <span className="font-medium">{new Date(campaignStats.startedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {campaignStats.completedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed:</span>
                        <span className="font-medium">{new Date(campaignStats.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No stats available</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Modal */}
      <AnimatePresence>
        {showLogsModal && selectedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Campaign Logs</h3>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                </div>
              ) : campaignLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Phone Number</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Sent At</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Message ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {campaignLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {log.contact?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">
                            {log.phoneNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              log.status === 'sent' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              log.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                              log.status === 'read' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {log.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-600">
                            {log.messageId ? log.messageId.slice(0, 20) + '...' : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-red-600">
                            {log.errorMessage || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No logs available</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};