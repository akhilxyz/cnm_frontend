import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  CreditCard,
  Share2,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { WAApi } from '../api/whatsapp.api';
import { useAuthStore } from '../store/useAuthStore';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar = ({ currentPage, onNavigate }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [WhatsAppBadgeCount, setWhatsAppBadgeCount] = useState(0);
  const { user } = useAuthStore();

  const getWAUnreadCount = async () => {
    try {
      const { responseObject } = await WAApi.Chat.getUnreadCountAll()
      setWhatsAppBadgeCount(responseObject?.count ?? 0)
    } catch (error) {

    }
  }
  useEffect(() => {
    getWAUnreadCount()
  }, [onNavigate]);

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },

    // show only if user is admin
    ...(user?.role === 'ADMIN'
      ? [{ icon: UserPlus, label: 'Vendors', path: 'vendors' }]
      : []),

    { icon: MessageSquare, label: 'WhatsApp', path: 'whatsapp', badge: WhatsAppBadgeCount },
    // { icon: Users, label: 'Contacts', path: 'contacts' },
    { icon: UserPlus, label: 'Leads', path: 'leads' },
    // { icon: FileText, label: 'Templates', path: 'templates' },
    { icon: Megaphone, label: 'Campaigns', path: 'campaigns' },
    { icon: CreditCard, label: 'My Subscription', path: 'subscription' },
    { icon: Share2, label: 'Share', path: 'share' },
    { icon: Settings, label: 'Settings', path: 'settings' },
  ];


  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0, width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-r border-gray-200 h-[calc(100vh-73px)] sticky top-[73px] overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.path;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      {
                        item.badge && item.badge > 0 ?
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isActive
                              ? 'bg-white text-emerald-600'
                              : 'bg-emerald-100 text-emerald-600'
                              }`}
                          >
                            {item.badge}
                          </motion.span>
                          : <></>
                      }

                    </>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-gray-200">
          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};
