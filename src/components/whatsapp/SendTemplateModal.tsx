import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface TemplatePlaceholderModalProps {
  template: any;
  onClose: () => void;
  onSend: (filledData: Record<string, string>) => void;
}

export const TemplatePlaceholderModal = ({
  template,
  onClose,
  onSend,
}: TemplatePlaceholderModalProps) => {
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const bodyText =
      template?.components?.find((c: any) => c.type === "BODY")?.text || "";
    const matches = bodyText.match(/\{\{(.*?)\}\}/g) || [];
    const clean = matches.map((m :any) => m.replace(/\{|\}/g, "").trim());
    setPlaceholders(clean);
  }, [template]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSend(values);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 w-[400px] shadow-xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Fill Template Placeholders
        </h3>

        {placeholders.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No placeholders found in this template.
          </p>
        ) : (
          <div className="space-y-3">
            {placeholders.map((ph, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ph}
                </label>
                <input
                  type="text"
                  placeholder={`Enter value for ${ph}`}
                  value={values[ph] || ""}
                  onChange={(e) => handleChange(ph, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="mt-5 w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition"
        >
          Send Template
        </button>
      </motion.div>
    </motion.div>
  );
};
