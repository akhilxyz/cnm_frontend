import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, MessageCircle, FileText, Settings } from 'lucide-react';
import { ChatsTab } from '../components/whatsapp/ChatsTab';
import { ContactsTab } from '../components/whatsapp/ContactsTab';
import { GroupsTab } from '../components/whatsapp/GroupsTab';
import { TemplatesTab } from '../components/whatsapp/TemplatesTab';
import WhatsappSetupGuide from './WhatsAppDoc';
import { platFormApi } from '../api/platform.api';
import { useConnectPlatformModal } from '../store/useConnectPlatformModal';

type Tab = 'chats' | 'contacts' | 'groups' | 'templates' | 'guide';

export const WhatsApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [loading, setisLoading] = useState<boolean>(false);
  const [isWAConnected, setisWAConnected] = useState<boolean>(false);
  const { setOpen } = useConnectPlatformModal();

  const tabs = [
    { id: 'chats' as Tab, label: 'Chats', icon: MessageSquare },
    { id: 'contacts' as Tab, label: 'Contacts', icon: Users },
    { id: 'groups' as Tab, label: 'Groups', icon: MessageCircle },
    { id: 'templates' as Tab, label: 'Templates', icon: FileText },
    { id: 'guide' as Tab, label: 'Setup Guide', icon: Settings },
  ];

  const isConnected = async () => {
    try {
      setisLoading(true)
      const { responseObject } = await platFormApi.isConnected('whatsapp')
      setisWAConnected(responseObject.isFound)
    } catch (error) {

    }
    setisLoading(false)
  }


  useEffect(() => {
    isConnected()
  }, [activeTab]);



  if (loading) {
    return <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Sticky Tab Header */}
        <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all relative ${activeTab === tab.id
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      </motion.div>
    </div>


  }

  if (!isWAConnected) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden max-h-[80vh] flex flex-col items-center justify-center p-10 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <Settings className="w-12 h-12 text-emerald-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              WhatsApp Not Connected
            </h2>
            <p className="text-gray-600 max-w-md">
              Your WhatsApp account is not connected yet. Please complete the setup
              to start managing chats, contacts, and templates seamlessly.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Connect Platform
            </button>
          </div>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Sticky Tab Header */}
        <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all relative ${activeTab === tab.id
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'chats' && <ChatsTab setActiveTab={setActiveTab} />}
              {activeTab === 'contacts' && <ContactsTab />}
              {activeTab === 'groups' && <GroupsTab />}
              {activeTab === 'templates' && <TemplatesTab />}
              {activeTab === 'guide' && <WhatsappSetupGuide />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
