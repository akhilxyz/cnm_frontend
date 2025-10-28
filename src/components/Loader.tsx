import { motion } from "framer-motion";

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center bg-white/40 backdrop-blur-md z-50"
    >
      <motion.div
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 shadow-lg"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
          borderRadius: ["50%", "30%", "50%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
