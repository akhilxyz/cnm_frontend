import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit, Trash2, UserPlus, X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { AdminApi } from "../api/admin.api";
import toast from "react-hot-toast";

interface User {
    id: number;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    createdAt: string;
    status?: "active" | "inactive" | "suspended";
}

interface UserFormData {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: string;
    loginWith: "email" | "phone";
    status: "active" | "inactive" | "suspended";
}

export default function Vendors() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(7);
    const [total, setTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState<UserFormData>({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "USER",
        loginWith: "email",
        status: "active",
    });

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { responseObject } = await AdminApi.userList(page, limit, search);
            setUsers(responseObject.data);
            setTotal(responseObject.total);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const { fullName, loginWith, email, phoneNumber, password } = formData;
        if (!fullName || (loginWith === "email" && !email) || (loginWith === "phone" && !phoneNumber) || (!editingUser && !password)) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            if (editingUser) {
                const updateData: any = {
                    fullName,
                    email,
                    role: formData.role,
                    status: formData.status,
                };
                if (password) updateData.password = password;

                await AdminApi.updateUser(editingUser.id, updateData);
                toast.success("User updated successfully");
            } else {
                const { phoneNumber, ...payload } = formData;
                await AdminApi.createUser({
                    ...payload,
                });
                toast.success("User created successfully");
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        setLoading(true);
        try {
            await AdminApi.deleteUser(userToDelete.id);
            toast.success("User deleted successfully");
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete user");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName,
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            password: "",
            role: user.role || "USER",
            loginWith: user.email ? "email" : "phone",
            status: user?.status?.toLowerCase() as any || "active",
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
            role: "USER",
            loginWith: "email",
            status: "active",
        });
        setEditingUser(null);
        setShowPassword(false);
    };

    const getStatusBadge = (status?: string) => {
        const statusColors = {
            active: "bg-emerald-100 text-emerald-700",
            inactive: "bg-gray-100 text-gray-700",
            suspended: "bg-red-100 text-red-700",
        };
        const statusText = status || "active";
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[statusText as keyof typeof statusColors]}`}>
                {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
            </span>
        );
    };

    const getRoleBadge = (role?: string) => {
        const roleColors = {
            ADMIN: "bg-purple-100 text-purple-700",
            USER: "bg-blue-100 text-blue-700",
        };
        const roleText = role || "USER";
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[roleText as keyof typeof roleColors]}`}>
                {roleText}
            </span>
        );
    };

    return (
        <div className="p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden max-h-[80vh] flex flex-col"

            // className="bg-white rounded-2xl shadow-lg overflow-hidden h-[90vh] flex flex-col"
            >
                {/* Sticky Header Section */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-10 pt-8 pb-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                        <p className="text-gray-600">Manage your platform users and their permissions</p>
                    </div>

                    {/* Search & Add User */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by name, email, or phone..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white shadow-sm"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                        >
                            <UserPlus className="w-5 h-5" />
                            Add New User
                        </motion.button>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-10 pb-6">
                    {/* Users Table */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th> */}
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                                                    <p className="text-gray-500 text-sm">Loading users...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Search className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">No users found</p>
                                                    <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {/* <td className="px-6 py-4 text-sm font-medium text-gray-900">#{user.id}</td> */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                                                            {user.fullName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{user.fullName}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Joined {new Date(user.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        {user.email && <div className="text-gray-900">{user.email}</div>}
                                                        {user.phoneNumber && <div className="text-gray-500">{user.phoneNumber}</div>}
                                                        {!user.email && !user.phoneNumber && <span className="text-gray-400">—</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                                <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit user"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => confirmDelete(user)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {total > limit && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium bg-white shadow-sm"
                            >
                                Previous
                            </motion.button>
                            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                                <span className="text-sm font-semibold text-gray-700">
                                    Page {page} of {Math.ceil(total / limit)}
                                </span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(total / limit)}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium bg-white shadow-sm"
                            >
                                Next
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* Add/Edit User Modal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className=" fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6" style={{overflow : "hidden!important"}}>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {editingUser ? "Edit User" : "Add New User"}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {editingUser ? "Update user information" : "Create a new user account"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div style={{ overflow: "hidden" }} className="space-y-5 overflow-hidden">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Login Method <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            disabled={true}
                                            value={formData.loginWith}
                                            onChange={(e) => setFormData({ ...formData, loginWith: e.target.value as "email" | "phone" })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 cursor-not-allowed"
                                        >
                                            <option value="email">Email</option>
                                            <option value="phone">Phone</option>
                                        </select>
                                    </div>

                                    {formData.loginWith === "email" ? (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                placeholder="user@example.com"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password {editingUser ? "(leave empty to keep current)" : <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                autoComplete="new-password"
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                placeholder="Enter password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
                                        >
                                            {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                                    Delete User?
                                </h3>

                                <p className="text-gray-600 text-center mb-6">
                                    Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete?.fullName}</span>?
                                    This action cannot be undone.
                                </p>

                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
                                    >
                                        {loading ? "Deleting..." : "Delete User"}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}