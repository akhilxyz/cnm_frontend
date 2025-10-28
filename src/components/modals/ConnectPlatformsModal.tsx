// src/components/modals/ConnectPlatformsModal.tsx
import { motion } from "framer-motion";
import { X, Facebook, Instagram, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PlatformSettingsModal } from "./PlatformSettingsModal";

export function ConnectPlatformsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  if (!open) return null;

  const platforms = [
    { name: "WhatsApp", icon: MessageCircle, color: "#25D366" },
    { name: "Instagram", icon: Instagram, color: "#E1306C" },
    { name: "Facebook", icon: Facebook, color: "#1877F2" },
    { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
    { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  ];
  

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-[90%] max-w-md relative shadow-xl"
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-lg font-semibold mb-4 text-center">Connect a Platform</h2>

          <div className="grid grid-cols-3 gap-4">
            {platforms.map(({ name, icon: Icon, color }) => (
              <button
                key={name}
                onClick={() => setSelectedPlatform(name)}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <Icon className="h-8 w-8" style={{ color }} />
                <span className="text-sm">{name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Settings modal for the selected platform */}
      {selectedPlatform && (
        <PlatformSettingsModal
          platform={selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </>
  );
}
