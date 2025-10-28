import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types/database';
import { NotificationApi } from '../api/notification.api';



export const Header = ({ setOpen, currentPage, setCurrentPage }: any) => {
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { responseObject } = await NotificationApi.fetchRecentNotifications(10)
      if (responseObject) {
        setNotifications(responseObject)
        const count = responseObject.filter((notif: any) => notif.read === false).length;
        setUnreadCount(count);
      }
      // setUnreadCount
    } catch (error) {

    }
  };

  const markAsRead = async (id: string, title: string) => {
    if (title?.toLowerCase().includes("whatsapp")) {
      setCurrentPage("whatsapp");
    }
    await NotificationApi.markNotificationAsRead(id)
    fetchNotifications();
    setShowNotifications(false)
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 backdrop-blur-lg shadow-lg'
        : 'bg-white shadow-sm'
        }`}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center"
          >
            <span className="text-white font-bold text-lg">W</span>
          </motion.div>
          <h1 className="text-xl font-bold text-gray-900">CNM Business</h1>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="
        flex items-center gap-2 px-5 py-2.5
        bg-gradient-to-r from-green-600 to-emerald-500
        text-white font-medium tracking-wide
        rounded-2xl shadow-md
        hover:from-green-700 hover:to-emerald-600
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
      "
          >
            Connect Platform

          </motion.button>


          <div className="relative" ref={notifRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3">
                    <h3 className="text-white font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No notifications yet</div>
                    ) : (
                      notifications.map((notif: any) => (
                        <motion.div
                          key={notif.id}
                          whileHover={
                            !notif.read
                              ? { backgroundColor: "#ecfdf5" } // Light green hover only for unread
                              : {}
                          }
                          onClick={() => markAsRead(notif.id, notif.title)}
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${!notif.read ? "bg-emerald-50 hover:bg-emerald-100" : "bg-white"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h4
                                className={`font-semibold text-sm ${!notif.read ? "text-emerald-800" : "text-gray-900"
                                  }`}
                              >
                                {notif.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif?.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 pr-4 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-700">{profile?.fullName || 'User'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{profile?.username}</p>
                    <p className="text-sm text-gray-500">Basic Plan</p>
                  </div>
                  <motion.button
                    whileHover={{ backgroundColor: '#fef2f2' }}
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
