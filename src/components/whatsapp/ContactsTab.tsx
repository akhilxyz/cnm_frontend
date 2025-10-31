import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit, Trash2, X, AlertTriangle, Download, Upload, CheckCircle, FileText, XCircle } from 'lucide-react';
import { WAApi } from '../../api/whatsapp.api';
import { countryList } from '../../lib/countryList';
import toast from 'react-hot-toast';

export interface Contact {
  id: number;
  tag : string;
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
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', countryCode: '', tag : '' });
  const [page, setPage] = useState(1);
  const [limit] = useState(7);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);
  const [loading, setLoading] = useState(false);
  const [loadingAdded, setLoadingAdded] = useState(false);


  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportResultModal, setShowImportResultModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const downloadTemplate = () => {
    const template = 'name,phone_number,country_code\nJohn Doe,1234567890,+1\nJane Smith,9876543210,+91';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };


  const handleExport = async () => {
    try {
      setIsExporting(true);
      const format = 'csv'
      // Axios returns plain text (not Response)
      const data = await WAApi.exportContacts(format);

      if (!data || typeof data !== 'string') {
        throw new Error('Invalid export data');
      }

      // Create blob from text data
      const blob = new Blob([data], {
        type: format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/json;charset=utf-8;'
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Contacts exported successfully');
    } catch (error) {
      console.error("Export failed:", error);
      toast.error('Failed to export contacts');
    } finally {
      setIsExporting(false);
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setShowError('');
      } else {
        setShowError('Please select a valid CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setShowError('Please select a file');
      return;
    }

    try {
      setIsImporting(true);
      const result = await WAApi.importContacts(selectedFile);
      setImportResult(result);
      setShowImportModal(false);
      setShowImportResultModal(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchContacts();
    } catch (error: any) {
      setShowError(error.message || 'Failed to import contacts');
    } finally {
      setIsImporting(false);
    }
  };
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
    setLoadingAdded(true)
    try {
      const payload = {
        phone_number: formData.phoneNumber,
        name: formData.name,
        country_code: formData.countryCode,
        // tag : formData?.tag ?? ''
      };

      if (editingContact) {
        await WAApi.updateContacts(editingContact.id, payload);
      } else {
        await WAApi.addContacts(payload);
      }

      await fetchContacts();
      setShowModal(false);
      setEditingContact(null);
      setFormData({ name: '', phoneNumber: '', countryCode: '' , tag : ''});
    } catch (error: any) {
      setShowError(error.message || 'Something went wrong');
    }
    setLoadingAdded(false)

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
      tag : contact.tag || ''
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', countryCode: '' , tag : ''});
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

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={isExporting || contacts.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Exporting...' : 'Export'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50"
          >
            <Upload className="w-5 h-5" />
            Import
          </motion.button>
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

      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="max-h-96 overflow-y-auto"> 
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Added On</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 overflow-y-auto" style={{overflow :"scroll"}}>
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
                  whileHover={{ backgroundColor: '' }}
                >
                  <td className="px-6 py-4 ">
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

      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
                <button onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setShowError('');
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* File Format Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">CSV Format Required</h3>
                    <p className="text-sm text-blue-800 mb-2">Your CSV file must have these columns:</p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li><strong>name</strong> - Contact name (required)</li>
                      <li><strong>phone_number</strong> - Phone number without country code (required)</li>
                      <li><strong>country_code</strong> - Country code with + (required, e.g., +1, +91)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Example Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Example CSV:</h4>
                <pre className="text-xs text-gray-700 font-mono bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                  {`name,phone_number,country_code
John Doe,1234567890,+1
Jane Smith,9876543210,+91
Bob Johnson,5551234567,+44`}
                </pre>
              </div>

              {/* Download Template Button */}
              <button
                onClick={downloadTemplate}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template CSV
              </button>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {selectedFile.name} selected
                  </p>
                )}
              </div>

              {showError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {showError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                    setShowError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import Contacts'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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


      {/* Import Result Modal */}
      <AnimatePresence>
        {showImportResultModal && importResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Import Results</h2>
                <button onClick={() => setShowImportResultModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-green-900">Successfully Added</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{importResult.success}</span>
                </div>

                {importResult.duplicates > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Duplicates Skipped</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</span>
                  </div>
                )}

                {importResult.failed > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="font-medium text-red-900">Failed</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{importResult.failed}</span>
                  </div>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-gray-900 mb-2">Errors:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {importResult.errors.map((error: any, idx: number) => (
                        <li key={idx}>• {error.contact}: {error.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowImportResultModal(false)}
                className="w-full mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
              >
                Close
              </button>
            </motion.div>
          </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tag (optional)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
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

                <motion.button
  type="submit"
  whileHover={{ scale: loadingAdded ? 1 : 1.02 }}
  whileTap={{ scale: loadingAdded ? 1 : 0.98 }}
  disabled={loadingAdded}
  className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 ${
    loadingAdded ? 'opacity-80 cursor-not-allowed' : ''
  }`}
>
  {loadingAdded ? (
    <>
      <svg
        className="w-5 h-5 animate-spin text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <span>Processing...</span>
    </>
  ) : (
    <span>{editingContact ? 'Update' : 'Add'}</span>
  )}
</motion.button>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};