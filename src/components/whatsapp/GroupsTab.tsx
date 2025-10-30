import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit, Trash2, X, Users, UserPlus, Settings, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { WAApi } from '../../api/whatsapp.api';

interface Group {
  id: number;
  groupId: string;
  groupName: string;
  description?: string;
  participants: string[];
  admins?: string[];
  createdAt: string;
  updatedAt: string;
}

export const GroupsTab = () => {
  // https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/sample-submission/
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    participants: ['']
  });

  const [membersFormData, setMembersFormData] = useState({
    participants: ['']
  });

  useEffect(() => {
    fetchGroups();
  }, [page]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await WAApi.Group.list(page, 10);
      if (response.success) {
        setGroups(response.data.data);
        setTotalGroups(response.data.total);
      }
    } catch (error: any) {
      // toast.error(error?.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out empty participants
      const validParticipants = formData.participants.filter(p => p.trim() !== '');

      if (validParticipants.length === 0) {
        toast.error('At least one participant is required');
        setLoading(false);
        return;
      }

      if (editingGroup) {
        // Update existing group
        const response = await WAApi.Group.update(editingGroup.groupId, {
          subject: formData.subject,
          description: formData.description
        });

        if (response.success) {
          toast.success('Group updated successfully');
          fetchGroups();
        }
      } else {
        // Create new group
        const response = await WAApi.Group.create({
          subject: formData.subject,
          participants: validParticipants,
          description: formData.description || ''
        });

        if (response.success) {
          toast.success('Group created successfully');
          fetchGroups();
        }
      }

      setShowModal(false);
      setEditingGroup(null);
      resetForm();
    } catch (error: any) {
      console.log("error", error)
      toast.error(error?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This will make the bot leave the group.')) {
      setLoading(true);
      try {
        const response = await WAApi.Group.delete(groupId);
        if (response.success) {
          toast.success('Group deleted successfully');
          fetchGroups();
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to delete group');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setLoading(true);
    try {
      const validParticipants = membersFormData.participants.filter(p => p.trim() !== '');

      if (validParticipants.length === 0) {
        toast.error('At least one participant is required');
        setLoading(false);
        return;
      }

      const response = await WAApi.Group.addMembers(selectedGroup.groupId, validParticipants);

      if (response.success) {
        toast.success('Members added successfully');
        setShowMembersModal(false);
        setMembersFormData({ participants: [''] });
        fetchGroups();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (groupId: string, phoneNumber: string) => {
    if (confirm(`Remove ${phoneNumber} from the group?`)) {
      setLoading(true);
      try {
        const response = await WAApi.Group.removeMember(groupId, phoneNumber);
        if (response.success) {
          toast.success('Member removed successfully');
          fetchGroups();
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to remove member');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePromoteDemote = async (groupId: string, phoneNumber: string, action: 'promote' | 'demote') => {
    setLoading(true);
    try {
      const response = await WAApi.Group.updateAdmins(groupId, { phoneNumber, action });
      if (response.success) {
        toast.success(`Member ${action}d successfully`);
        fetchGroups();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} member`);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      subject: group.groupName,
      description: group.description || '',
      participants: group.participants || ['']
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingGroup(null);
    resetForm();
    // setShowModal(true);
    setShowGroupModal(true)
  };

  const openMembersModal = (group: Group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
  };

  const openSettingsModal = (group: Group) => {
    setSelectedGroup(group);
    setShowSettingsModal(true);
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      participants: ['']
    });
  };

  const addParticipantField = () => {
    setFormData({
      ...formData,
      participants: [...formData.participants, '']
    });
  };

  const removeParticipantField = (index: number) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      participants: newParticipants.length > 0 ? newParticipants : ['']
    });
  };

  const updateParticipant = (index: number, value: string) => {
    const newParticipants = [...formData.participants];
    newParticipants[index] = value;
    setFormData({
      ...formData,
      participants: newParticipants
    });
  };

  const addMemberField = () => {
    setMembersFormData({
      participants: [...membersFormData.participants, '']
    });
  };

  const removeMemberField = (index: number) => {
    const newParticipants = membersFormData.participants.filter((_, i) => i !== index);
    setMembersFormData({
      participants: newParticipants.length > 0 ? newParticipants : ['']
    });
  };

  const updateMemberField = (index: number, value: string) => {
    const newParticipants = [...membersFormData.participants];
    newParticipants[index] = value;
    setMembersFormData({
      participants: newParticipants
    });
  };

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </motion.button>
      </div>

      {/* Groups Grid */}
      {loading && groups.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) :
        filteredGroups?.length === 0 ?
          <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-medium">
            No group
          </div>
          :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openMembersModal(group)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Manage Members"
                    >
                      <UserPlus className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openSettingsModal(group)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(group)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(group.groupId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{group.groupName}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {group.description || 'No description'}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {group.participants?.length || 0} members
                      </span>
                    </div>
                    {group.admins && group.admins.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Crown className="w-4 h-4" />
                        <span className="text-xs font-medium">{group.admins.length} admins</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
      }

      {/* Pagination */}
      {totalGroups > 10 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {Math.ceil(totalGroups / 10)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(totalGroups / 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Group Modal */}
      <AnimatePresence>
        {
          showGroupModal && !showModal &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Create Group Requirements
                </h3>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-gray-700">
                <p className="text-base leading-relaxed">
                  Before creating a WhatsApp group using the Cloud API, please ensure the following:
                </p>

                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Your app must be approved for <b>“Groups API”</b> access in Meta App Review.</li>
                  <li>You must use a valid <b>Business Phone Number ID</b> associated with your WhatsApp Business Account.</li>
                  <li>Requests must include a valid <b>access token</b> with permissions for:
                    <code className="bg-gray-100 px-1 rounded text-xs">whatsapp_business_messaging</code> and
                    <code className="bg-gray-100 px-1 rounded text-xs">whatsapp_business_management</code>.
                  </li>
                  <li>Group subject (<code>subject</code>) is <b>required</b> — up to 128 characters.</li>
                  <li>Group description (<code>description</code>) is optional — up to 2048 characters.</li>
                  <li><code>join_approval_mode</code> can be either <b>auto_approve</b> or <b>approval_required</b>.</li>
                </ul>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm">
                    📘 For detailed setup and review submission, visit:
                  </p>
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/sample-submission/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    WhatsApp Business API App Review Guide ↗
                  </a>
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>


        }
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowModal(false)
              setShowGroupModal(false)
            }
            }
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingGroup ? 'Edit Group' : 'Create Group'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowGroupModal(false)

                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., Team Updates"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                    placeholder="Optional group description"
                    maxLength={512}
                  />
                </div>

                {!editingGroup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participants * (Phone numbers with country code)
                    </label>
                    <div className="space-y-2">
                      {formData.participants.map((participant, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={participant}
                            onChange={(e) => updateParticipant(index, e.target.value)}
                            placeholder="+1234567890"
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          />
                          {formData.participants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeParticipantField(index)}
                              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addParticipantField}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        + Add Participant
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowModal(false)
                      setShowGroupModal(false)
                    }

                    }
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : editingGroup ? 'Update' : 'Create'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Management Modal */}
      <AnimatePresence>
        {showMembersModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMembersModal(false)}
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
                  Manage Members - {selectedGroup.groupName}
                </h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Members */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Current Members</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGroup.participants?.map((phone, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-mono text-sm">{phone}</span>
                      <div className="flex gap-2">
                        {selectedGroup.admins?.includes(phone) ? (
                          <>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                              Admin
                            </span>
                            <button
                              onClick={() => handlePromoteDemote(selectedGroup.groupId, phone, 'demote')}
                              className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                              Demote
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handlePromoteDemote(selectedGroup.groupId, phone, 'promote')}
                            className="text-xs px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg"
                          >
                            Make Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(selectedGroup.groupId, phone)}
                          className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Members */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-3">Add New Members</h4>
                <form onSubmit={handleAddMembers} className="space-y-3">
                  {membersFormData.participants.map((participant, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={participant}
                        onChange={(e) => updateMemberField(index, e.target.value)}
                        placeholder="+1234567890"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                      {membersFormData.participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMemberField(index)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addMemberField}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    + Add More
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Members'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal - Coming Soon */}
      <AnimatePresence>
        {showSettingsModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Group Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold mb-2">{selectedGroup.groupName}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedGroup.description || 'No description'}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Group ID:</span>
                      <span className="font-mono text-xs">{selectedGroup.groupId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Members:</span>
                      <span className="font-semibold">{selectedGroup.participants?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admins:</span>
                      <span className="font-semibold">{selectedGroup.admins?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Group Icon Upload */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Group Icon
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setLoading(true);
                          const response = await WAApi.Group.updateIcon(selectedGroup.groupId, file);
                          if (response.success) {
                            toast.success('Group icon updated successfully');
                            fetchGroups();
                          }
                        } catch (error: any) {
                          toast.error(error?.response?.data?.message || 'Failed to update icon');
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Additional Settings */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Advanced Settings</h4>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Announcement Mode</p>
                      <p className="text-xs text-gray-600">Only admins can send messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={async (e) => {
                          try {
                            setLoading(true);
                            const response = await WAApi.Group.updateSettings(selectedGroup.groupId, {
                              announcementMode: e.target.checked
                            });
                            if (response.success) {
                              toast.success('Setting updated');
                            }
                          } catch (error: any) {
                            toast.error(error?.response?.data?.message || 'Failed to update');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Restricted Addition</p>
                      <p className="text-xs text-gray-600">Only admins can add members</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={async (e) => {
                          try {
                            setLoading(true);
                            const response = await WAApi.Group.updateSettings(selectedGroup.groupId, {
                              restrictedAddition: e.target.checked
                            });
                            if (response.success) {
                              toast.success('Setting updated');
                            }
                          } catch (error: any) {
                            toast.error(error?.response?.data?.message || 'Failed to update');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupsTab