import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Key, Bot, MessageSquare, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

type Tab = 'general' | 'api' | 'ai' | 'whatsapp';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const {user}= useAuthStore()

  const [settings, setSettings] = useState({
    general: {
      businessName: 'My Business',
      email: 'business@example.com',
      phone: '+1234567890',
      timezone: 'UTC',
      language: 'en',
    },
    api: {
      apiKey: '••••••••••••••••',
      webhookUrl: '',
      callbackUrl: '',
    },
    ai: {
      enableAI: false,
      autoReply: false,
      sentiment: false,
      language: 'en',
    },
    whatsapp: {
      businessHours: false,
      autoArchive: false,
      readReceipts: false,
      typing: false,
    },
  });

  const tabs = [
    { id: 'general' as Tab, label: 'General Settings', icon: SettingsIcon },
    { id: 'api' as Tab, label: 'API Keys', icon: Key },
    { id: 'ai' as Tab, label: 'AI / Bots', icon: Bot },
    { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageSquare },
  ];

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all relative ${
                      activeTab === tab.id ? 'text-emerald-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="settingsTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      disabled
                      value={user.fullName}
                      /* onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, businessName: e.target.value }
                      })} */
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email}
                      /* onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, email: e.target.value }
                      })} */
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      disabled
                      value={user?.phoneNumber}
                     /*  onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, phone: e.target.value }
                      })} */
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        disabled
                        value={settings.general.timezone}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, timezone: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">EST</option>
                        <option value="PST">PST</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                      disabled
                        value={settings.general.language}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, language: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.api.apiKey}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 font-mono text-sm"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                        Regenerate
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Keep your API key secure and never share it publicly</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                    <input
                      type="url"
                      value={settings.api.webhookUrl}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, webhookUrl: e.target.value }
                      })}
                      placeholder="https://your-domain.com/webhook"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Callback URL</label>
                    <input
                      type="url"
                      value={settings.api.callbackUrl}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, callbackUrl: e.target.value }
                      })}
                      placeholder="https://your-domain.com/callback"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">API Documentation</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Learn how to integrate our API into your applications
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                      View Documentation →
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Enable AI Features</h4>
                      <p className="text-sm text-gray-600">Use AI to enhance your messaging experience</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.ai.enableAI}
                        onChange={(e) => setSettings({
                          ...settings,
                          ai: { ...settings.ai, enableAI: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Auto Reply</h4>
                      <p className="text-sm text-gray-600">Automatically respond to common queries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.ai.autoReply}
                        onChange={(e) => setSettings({
                          ...settings,
                          ai: { ...settings.ai, autoReply: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Sentiment Analysis</h4>
                      <p className="text-sm text-gray-600">Analyze customer sentiment in messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.ai.sentiment}
                        onChange={(e) => setSettings({
                          ...settings,
                          ai: { ...settings.ai, sentiment: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">AI Language</label>
                    <select
                      value={settings.ai.language}
                      onChange={(e) => setSettings({
                        ...settings,
                        ai: { ...settings.ai, language: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Business Hours</h4>
                      <p className="text-sm text-gray-600">Display business hours to customers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.whatsapp.businessHours}
                        onChange={(e) => setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, businessHours: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Auto Archive</h4>
                      <p className="text-sm text-gray-600">Automatically archive old conversations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.whatsapp.autoArchive}
                        onChange={(e) => setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, autoArchive: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Read Receipts</h4>
                      <p className="text-sm text-gray-600">Show when you've read messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.whatsapp.readReceipts}
                        onChange={(e) => setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, readReceipts: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Typing Indicators</h4>
                      <p className="text-sm text-gray-600">Show when you're typing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled
                        checked={settings.whatsapp.typing}
                        onChange={(e) => setSettings({
                          ...settings,
                          whatsapp: { ...settings.whatsapp, typing: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white transition-colors"
              >
                Upgrade plan to use this feature
              </motion.button>
              {/* <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white transition-colors"
              >
                Reset to Default
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                // onClick={handleSave}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </motion.button> */}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
