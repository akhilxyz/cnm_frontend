import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Megaphone, FileText, TrendingUp, Activity } from 'lucide-react';
import {
  /* LineChart,
  Line, */
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { WAApi } from '../api/whatsapp.api';

interface Stats {
  totalContacts: number;
  totalCampaigns: number;
  totalTemplates: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalContacts: 0, totalCampaigns: 0, totalTemplates: 0 });
  const [messageActivity, setMessageActivity] = useState<any[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<any[]>([]);
  const [deliveryRate, setDeliveryRate] = useState<any | null>(null);
  const [recentActivity, setRecentActivity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatsFromApi = async () => {
    setLoading(true)

    try {
      const { responseObject } = await WAApi.dashboardData();
      const { responseObject: templatesObj } = await WAApi.getTemplatesList();

      if (responseObject) {
        setStats({
          ...responseObject.summary,
          totalTemplates: templatesObj?.data?.length || 0,
        });

        setMessageActivity(responseObject.messageActivity || []);
        setCampaignPerformance(responseObject.campaignPerformance || []);

        // ✅ Fix here: deliveryRate is an object, not an array
        const dr = responseObject.deliveryRate || {};
        const deliveryRateData = [
          { name: 'Delivered', value: dr.delivered ?? 0 },
          { name: 'Read', value: dr.read ?? 0 },
          { name: 'Failed', value: dr.failed ?? 0 },
          { name: 'Pending', value: dr.pending ?? 0 },
          { name: 'Total Sent', value: dr.totalSent ?? 0 },
        ];

        setDeliveryRate({
          raw: dr,
          chart: deliveryRateData,
        });

        setRecentActivity(responseObject.recentActivity || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false)

  };

  useEffect(() => {
    fetchStatsFromApi();
  }, []);

  const statCards = [
    { icon: Users, label: 'Total Contacts', value: stats.totalContacts, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-100' },
    { icon: Megaphone, label: 'Total Campaigns', value: stats.totalCampaigns, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-100' },
    { icon: FileText, label: 'Total Templates', value: stats.totalTemplates, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-100' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold mb-2"
              >
                Welcome back!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-emerald-100 text-lg"
              >
                Here's what's happening with your CNM Business today
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <Activity className="w-10 h-10" />
            </motion.div>
          </div>
        </motion.div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-100/40 to-transparent" style={{ animationDelay: `${i * 0.2}s` }}></div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </motion.div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i === 1 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-blue-100/40 to-transparent" style={{ animationDelay: `${i * 0.3}s` }}></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-end gap-2">
                    <div className="h-12 bg-gray-200 rounded w-full animate-pulse" style={{ height: `${Math.random() * 150 + 50}px`, animationDelay: `${j * 0.1}s` }}></div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Delivery Rate Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-purple-100/40 to-transparent"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="h-16 bg-gray-200 rounded w-full animate-pulse" style={{ height: `${Math.random() * 200 + 100}px`, animationDelay: `${i * 0.15}s` }}></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.1}s` }}></div>
              </div>
            ))}
          </div>
        </motion.div>

        <style>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-2"
            >
              Welcome back!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-emerald-100 text-lg"
            >
              Here's what's happening with your WhatsApp CNM today
            </motion.p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
          >
            <Activity className="w-10 h-10" />
          </motion.div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-1 text-emerald-600 text-sm font-semibold"
                >
                  <TrendingUp className="w-4 h-4" />
                  {card.value?.toLocaleString() || 0}
                </motion.div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.label}</h3>
              <p className="text-3xl font-bold text-gray-900">{card.value?.toLocaleString() || 0}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Message Activity & Campaign */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Message Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={messageActivity || []}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="messages" stroke="#10b981" strokeWidth={3} fill="url(#colorMessages)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Campaign Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px' }} />
              <Bar dataKey="campaigns" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Delivery Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Rate Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deliveryRate?.chart || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px' }} />
            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {deliveryRate?.raw && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Delivery Rate</p>
              <p className="text-xl font-bold text-emerald-600">{deliveryRate.raw.deliveryRate ?? 0}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Read Rate</p>
              <p className="text-xl font-bold text-blue-600">{deliveryRate.raw.readRate ?? 0}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Failure Rate</p>
              <p className="text-xl font-bold text-red-600">{deliveryRate.raw.failureRate ?? 0}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sent</p>
              <p className="text-xl font-bold text-gray-800">{deliveryRate.raw.totalSent ?? 0}</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
