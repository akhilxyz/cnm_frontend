import { http } from "."



const addContacts = async (data: any): Promise<any | null> => {
    try {
        const response = await http.post(`/whatsapp/add-contacts`, data);
        return response.data.responseObject;
    } catch (error: any) {
        throw error?.response?.data?.message || 'Something Went Wrong';
    }
};

const exportContacts = async (format: string = 'csv'): Promise<string> => {
    const response = await http.get(`/whatsapp/contacts/export`, {
        params: { format: format },
        responseType: 'text', // important
    });
    return response.data;
};


const importContacts = async (file: any): Promise<any | null> => {
    try {

        const formData = new FormData();
        formData.append('file', file); // must match uploadFile.single('file')

        const response = await http.post(`/whatsapp/contacts/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.responseObject;
    } catch (error: any) {
        throw error?.response?.data?.message || 'Something Went Wrong';
    }
};



const updateContacts = async (id: number, data: any): Promise<any | null> => {
    try {
        const response = await http.put(`/whatsapp/update-contacts/` + id, data);
        return response.data.responseObject;
    } catch (error: any) {
        throw error?.response?.data?.message || 'Something Went Wrong';
    }
};


const deleteContacts = async (id: number): Promise<any | null> => {
    try {
        const response = await http.delete(`/whatsapp/contacts/` + id);
        return response.data.responseObject;
    } catch (error: any) {
        throw error?.response?.data?.message || 'Something Went Wrong';
    }
};


// /update-contacts/:id
const fetchContactsList = async (page = 1, limit = 10, search: string = ''): Promise<any | null> => {
    try {
        const response = await http.get(`/whatsapp/contacts-list`, {
            params: { page, limit, search }
        });

        return response.data.responseObject;
    } catch (error) {
        console.error('Error fetching contacts list:', error);
        return null;
    }
};


export const Chat = {
    // 🚀 Send a message
    sendMessage: async (data: any) => {
        const res = await http.post("/whatsapp/send", data);
        return res.data;
    },


    sendTemplateMessage: async (data: any) => {
        const res = await http.post("/whatsapp/send-template", data);
        return res.data;
    },


    // 💬 Get chat history
    getChatHistory: async (contactId: number) => {
        const res = await http.get(`/whatsapp/history/${contactId}`);
        return res.data;
    },

    // 🧾 Get all conversations
    getConversations: async () => {
        const res = await http.get(`/whatsapp/conversations`);
        return res.data;
    },

    // 🔢 Get unread count
    getUnreadCount: async (whatsappAccountId: number, contactId: number) => {
        const res = await http.get(`/whatsapp/unread/${whatsappAccountId}/${contactId}`);
        return res.data;
    },

    getUnreadCountAll: async () => {
        const res = await http.get(`/whatsapp/unread/all`);
        return res.data;
    },

    // 📩 Mark messages as read
    markAsRead: async (contactId: number) => {
        const res = await http.put(`/whatsapp/mark-read/${contactId}`);
        return res.data;
    },
};

const downloadMedia = async (mediaId: string) => {
    const res = await http.get(`/whatsapp/downloadMedia/${mediaId}`);
    return res.data;
}


const uploadMedia = async (file: any) => {
    const res = await http.post(`/whatsapp/upload/media`, file, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
}

const getTemplatesList = async () => {
    const res = await http.get(`/whatsapp/templates-list`);
    return res.data;
};

const createTemplate = async (payload: any) => {
    const res = await http.post(`/whatsapp/templates-create`, payload);
    return res.data;
};



// ==================== GROUP APIs ====================

const getGroupsList = async (page = 1, limit = 10) => {
    const res = await http.get(`/whatsapp/groups/list`, {
        params: { page, limit }
    });
    return res.data;
};

const getGroupDetails = async (groupId: string) => {
    const res = await http.get(`/whatsapp/groups/${groupId}`);
    return res.data;
};

const createGroup = async (payload: { subject: string; participants: string[], description: string }) => {
    const res = await http.post(`/whatsapp/groups/create`, payload);
    return res.data;
};

const updateGroup = async (groupId: string, payload: { subject?: string; description?: string }) => {
    const res = await http.put(`/whatsapp/groups/${groupId}`, payload);
    return res.data;
};

const deleteGroup = async (groupId: string) => {
    const res = await http.delete(`/whatsapp/groups/${groupId}`);
    return res.data;
};

const addGroupMembers = async (groupId: string, participants: string[]) => {
    const res = await http.post(`/whatsapp/groups/${groupId}/members`, { participants });
    return res.data;
};

const removeGroupMember = async (groupId: string, phoneNumber: string) => {
    const res = await http.delete(`/whatsapp/groups/${groupId}/members/${phoneNumber}`);
    return res.data;
};

const updateGroupAdmins = async (groupId: string, payload: { phoneNumber: string; action: 'promote' | 'demote' }) => {
    const res = await http.put(`/whatsapp/groups/${groupId}/admins`, payload);
    return res.data;
};

const updateGroupSettings = async (groupId: string, payload: { announcementMode?: boolean; restrictedAddition?: boolean }) => {
    const res = await http.put(`/whatsapp/groups/${groupId}/settings`, payload);
    return res.data;
};

const updateGroupIcon = async (groupId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await http.put(`/whatsapp/groups/${groupId}/icon`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
};

const sendGroupMessage = async (groupId: string, payload: any) => {
    const res = await http.post(`/whatsapp/groups/${groupId}/send`, payload);
    return res.data;
};

const getGroupChatHistory = async (groupId: string, page = 1, limit = 50) => {
    const res = await http.get(`/whatsapp/groups/${groupId}/history`, {
        params: { page, limit }
    });
    return res.data;
};

const getNewLeads = async (params: any, download = false) => {
    const config: any = { params };

    // If downloading, set responseType to 'blob'
    if (download) {
        config.responseType = "blob";
    }

    const res = await http.get(`/whatsapp/new_leads${download ? "?download=true" : ""}`, config);
    return res.data;
};


// Group object for cleaner exports
const Group = {
    list: getGroupsList,
    details: getGroupDetails,
    create: createGroup,
    update: updateGroup,
    delete: deleteGroup,
    addMembers: addGroupMembers,
    removeMember: removeGroupMember,
    updateAdmins: updateGroupAdmins,
    updateSettings: updateGroupSettings,
    updateIcon: updateGroupIcon,
    sendMessage: sendGroupMessage,
    chatHistory: getGroupChatHistory,
};



// ==================== CAMPAIGN APIs ====================

const getCampaignsList = async (page = 1, limit = 10, status?: string) => {
    const res = await http.get(`/whatsapp/campaigns/list`, {
        params: { page, limit, status }
    });
    return res.data;
};

const getCampaignDetails = async (campaignId: number) => {
    const res = await http.get(`/whatsapp/campaigns/${campaignId}`);
    return res.data;
};

const createCampaign = async (payload: any) => {
    const res = await http.post(`/whatsapp/campaigns/create`, payload);
    return res.data;
};

const updateCampaign = async (campaignId: number, payload: any) => {
    const res = await http.put(`/whatsapp/campaigns/${campaignId}`, payload);
    return res.data;
};

const deleteCampaign = async (campaignId: number) => {
    const res = await http.delete(`/whatsapp/campaigns/${campaignId}`);
    return res.data;
};

const sendCampaign = async (campaignId: number) => {
    const res = await http.post(`/whatsapp/campaigns/${campaignId}/send`);
    return res.data;
};

const scheduleCampaign = async (campaignId: number, scheduledAt: string) => {
    const res = await http.post(`/whatsapp/campaigns/${campaignId}/schedule`, { scheduledAt });
    return res.data;
};

const pauseCampaign = async (campaignId: number) => {
    const res = await http.post(`/whatsapp/campaigns/${campaignId}/pause`);
    return res.data;
};

const resumeCampaign = async (campaignId: number) => {
    const res = await http.post(`/whatsapp/campaigns/${campaignId}/resume`);
    return res.data;
};

const getCampaignLogs = async (campaignId: number, page = 1, limit = 50) => {
    const res = await http.get(`/whatsapp/campaigns/${campaignId}/logs`, {
        params: { page, limit }
    });
    return res.data;
};

const getCampaignStats = async (campaignId: number) => {
    const res = await http.get(`/whatsapp/campaigns/${campaignId}/stats`);
    return res.data;
};



const dashboardData = async () => {
    const res = await http.get(`/whatsapp/dashboard-data`);
    return res.data;
};


// Campaign object for cleaner exports
const Campaign = {
    list: getCampaignsList,
    details: getCampaignDetails,
    create: createCampaign,
    update: updateCampaign,
    delete: deleteCampaign,
    send: sendCampaign,
    schedule: scheduleCampaign,
    pause: pauseCampaign,
    resume: resumeCampaign,
    logs: getCampaignLogs,
    stats: getCampaignStats,
};

export const WAApi = {
    fetchContactsList,
    addContacts,
    exportContacts,
    importContacts,
    updateContacts,
    deleteContacts,
    downloadMedia,
    uploadMedia,
    getTemplatesList,
    createTemplate,
    getNewLeads,
    Chat,
    Group,
    Campaign,
    dashboardData
}