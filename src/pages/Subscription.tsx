import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Subscription as SubType } from '../types/database';

export const Subscription = () => {
  const [currentPlan, setCurrentPlan] = useState<SubType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .maybeSingle();

    if (data) {
      setCurrentPlan(data);
    } else {
      // Set default Basic plan if no subscription found
      setCurrentPlan({ plan_name: 'Basic', status: 'Active' } as SubType);
    }
  };

  const handleUpgradeClick = (planName: string) => {
    setSelectedPlan(planName);
    setModalOpen(true);
  };

  const plans = [
    {
      name: 'Basic',
      icon: Sparkles,
      price: 5,
      period: 'month',
      color: 'from-gray-500 to-gray-600',
      features: [
        'Up to 100 contacts',
        '50 messages per month',
        '1 template',
        'Basic analytics',
        'Email support',
      ],
    },
    {
      name: 'Gold',
      icon: Crown,
      price: 29,
      period: 'month',
      color: 'from-amber-500 to-amber-600',
      popular: true,
      features: [
        'Up to 5,000 contacts',
        'Unlimited messages',
        '20 templates',
        'Advanced analytics',
        'Priority support',
        'Campaign automation',
        'Custom branding',
      ],
    },
    {
      name: 'Platinum',
      icon: Zap,
      price: 99,
      period: 'month',
      color: 'from-purple-500 to-purple-600',
      features: [
        'Unlimited contacts',
        'Unlimited messages',
        'Unlimited templates',
        'Real-time analytics',
        '24/7 dedicated support',
        'AI-powered automation',
        'White label solution',
        'API access',
        'Custom integrations',
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Scale your WhatsApp Business with the perfect plan for your needs
          </p>
        </motion.div>

        {/* Current Plan */}
        {currentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 mb-1">Current Plan</p>
                <h2 className="text-3xl font-bold">{currentPlan.plan_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 mb-1">Status</p>
                <p className="text-2xl font-bold">{currentPlan.status}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan?.plan_name === plan.name;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -12 }}
                className={`bg-white rounded-3xl p-8 shadow-xl relative ${
                  plan.popular ? 'ring-4 ring-emerald-500 ring-offset-4' : ''
                }`}
              >
                {plan.popular && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                  >
                    Most Popular
                  </motion.div>
                )}

                <div
                  className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mb-6`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/ {plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isCurrentPlan}
                  onClick={() => handleUpgradeClick(plan.name)}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isCurrentPlan
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Upgrade Now'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Need a custom plan?</h3>
          <p className="text-gray-600 mb-6">
            Contact our sales team for enterprise solutions and custom pricing
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModalOpen(true)}
            className="bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Contact Sales
          </motion.button>
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrade Request</h2>
            <p className="text-gray-700 mb-6">
              You requested to upgrade to the <span className="font-semibold">{selectedPlan}</span> plan.
              <br />
              For security and billing reasons, please contact our support team or your account administrator to proceed with the upgrade.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
