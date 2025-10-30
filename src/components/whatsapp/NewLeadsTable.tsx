import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Search, X } from "lucide-react";
import { format } from "date-fns";
import { WAApi } from "../../api/whatsapp.api";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

interface NewLead {
    id: number;
    name: string;
    phoneNumber: string;
    message: string | null;
    createdAt: string;
}

const NewLeads: React.FC = () => {
    const [leads, setLeads] = useState<NewLead[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedLead, setSelectedLead] = useState<NewLead | null>(null);

    const handleDownloadCSV = async () => {
        try {
            setLoading(true);

            const params = {
                page,
                limit,
                search: searchQuery,
                startDate,
                endDate,
            };

            // Pass `download=true` to get CSV blob
            const blobData = await WAApi.getNewLeads(params, true);

            const blob = new Blob([blobData], { type: "text/csv;charset=utf-8" });
            saveAs(blob, `new_leads_${Date.now()}.csv`);
        } catch (error) {
            console.error("Download CSV error:", error);
            toast.error("Failed to download CSV");
        } finally {
            setLoading(false);
        }
    };

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit, search: searchQuery, startDate, endDate };
            const { responseObject } = await WAApi.getNewLeads(params);
            if (responseObject.data) {
                setLeads(responseObject.data);
                setTotalPages(responseObject.total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [page, searchQuery, startDate, endDate]);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Download CSV Button */}

                <div className="flex gap-2 flex-wrap">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border px-3 py-2 rounded-xl outline-none"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border px-3 py-2 rounded-xl outline-none"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPage(1)}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
                    >
                        Filter
                    </motion.button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadCSV}
                    disabled={loading || leads.length === 0}
                    className="ml-4 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                    <Download className="w-5 h-5" />
                    Download CSV
                </motion.button>

            </div>

            {/* Leads Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : leads.length === 0 ? (
                <div className="flex justify-center items-center py-12 text-gray-500 text-lg font-medium">
                    No leads found
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leads.map((lead) => (
                        <motion.div
                            key={lead.id}
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                            onClick={() => setSelectedLead(lead)}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{lead.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{lead.phoneNumber}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {lead.message || "No message"}
                            </p>
                            <div className="text-xs text-gray-400 mt-3">
                                {format(new Date(lead.createdAt), "yyyy-MM-dd HH:mm")}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
                <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="px-4 py-2">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* Lead Details Modal */}
            <AnimatePresence>
                {selectedLead && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedLead(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">{selectedLead.name}</h3>
                                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                                <b>Phone:</b> {selectedLead.phoneNumber}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">
                                <b>Message:</b> {selectedLead.message || "No message"}
                            </p>
                            <p className="text-xs text-gray-400">
                                <b>Created At:</b> {format(new Date(selectedLead.createdAt), "yyyy-MM-dd HH:mm")}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NewLeads;
