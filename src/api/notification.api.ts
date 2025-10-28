import { http } from ".";

// Create a new notification
const createNotification = async (data: {
  whatsappAccountId: number;
  contactId: number;
  title: string;
  message: string;
}) => {
  const res = await http.post("/notification/create", data);
  return res.data;
};

// Fetch recent notifications for a WhatsApp account
const fetchRecentNotifications = async (limit = 5) => {
  const res = await http.get("/notification/recent", {
    params: {  limit },
  });
  return res.data;
};

// Mark a notification as read
const markNotificationAsRead = async (id: string) => {
  const res = await http.patch(`/notification/${id}/read`);
  return res.data;
};

// a structured API object
export const NotificationApi = {
  createNotification,
  fetchRecentNotifications,
  markNotificationAsRead,
};
