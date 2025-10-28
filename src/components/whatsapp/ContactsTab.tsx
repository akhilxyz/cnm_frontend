import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { WAApi } from '../../api/whatsapp.api';
import { countryList } from '../../lib/countryList';
import toast from 'react-hot-toast';

export interface Contact {
  id: number;
  whatsappAccountId: number;
  name: string;
  phoneNumber: string;
  email?: string | null;
  countryCode: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ContactsTab = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [showError, setShowError] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', countryCode: '' });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);
  const [loading, setLoading] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchContacts();
  }, [page, debouncedSearch]);

  useEffect(() => {
    setShowError('');
  }, [formData]);

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await WAApi.fetchContactsList(page, limit, debouncedSearch);
      if (response && response.contacts) {
        setContacts(response.contacts);
        setTotal(response.pagination.total || 0);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
    setLoading(false)

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        phone_number: formData.phoneNumber,
        name: formData.name,
        country_code: formData.countryCode,
      };

      if (editingContact) {
        await WAApi.updateContacts(editingContact.id, payload);
      } else {
        await WAApi.addContacts(payload);
      }

      await fetchContacts();
      setShowModal(false);
      setEditingContact(null);
      setFormData({ name: '', phoneNumber: '', countryCode: '' });
    } catch (error: any) {
      setShowError(error.message || 'Something went wrong');
    }
  };

  const openDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      await WAApi.deleteContacts(contactToDelete.id);
      await fetchContacts();
      setShowDeleteDialog(false);
      setContactToDelete(null);
      toast.success('Contact deleted successfully');
    } catch (error) {
      setShowDeleteDialog(false);
      setShowErrorDialog(true);
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      countryCode: contact.countryCode || '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', countryCode: '' });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </motion.button>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Added On</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              // 🔹 Show loading spinner when fetching contacts
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  </div>
                </td>
              </tr>
            ) : contacts.length > 0 ? (
              // 🔹 Show contacts list
              contacts.map((contact) => (
                <motion.tr
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{contact.phoneNumber}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEditModal(contact)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openDeleteDialog(contact)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              // 🔹 Show “No Contact found” when no data
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  <div className="flex justify-center items-center h-64 text-gray-500 text-lg font-medium">
                    No Contact found
                  </div>
                </td>
              </tr>
            )}
          </tbody>


        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && contactToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Delete Contact
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold">{contactToDelete.name}</span>?
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Note: You can only delete contacts that don't have any messages or chat history.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setContactToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:bg-red-700 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Dialog */}
      <AnimatePresence>
        {showErrorDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowErrorDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Cannot Delete Contact
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    This contact cannot be deleted because they have existing messages or chat history. You can only delete contacts that don't have any messages yet.
                  </p>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowErrorDialog(false);
                  setContactToDelete(null);
                }}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingContact ? 'Edit Contact' : 'Add Contact'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    disabled={editingContact ? true : false}
                    type="number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none 
                      ${editingContact
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300"
                        : "border-gray-200"
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country Code
                  </label>
                  <select
                    disabled={editingContact ? true : false}
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select country code</option>
                    {countryList.map((c) => (
                      <option key={c.code} value={c.dial_code}>
                        {c.name} ({c.dial_code})
                      </option>
                    ))}
                  </select>
                </div>

                {showError && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
                  >
                    {showError}
                  </motion.div>
                )}

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
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
                  >
                    {editingContact ? 'Update' : 'Add'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};