import { motion } from 'framer-motion';

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-white border-t border-gray-200 py-4 px-6 mt-auto"
    >
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>© 2025 CM Business Dashboard. All rights reserved.</p>
        <p>Version 1.0.0</p>
      </div>
    </motion.footer>
  );
};
