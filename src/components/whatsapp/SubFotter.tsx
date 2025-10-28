import React from "react";

interface SubFooterProps {
  guideLink?: string;
}

export const SubFooter: React.FC<SubFooterProps> = ({ guideLink }) => {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4 flex justify-center items-center gap-4">
      {guideLink && (
        <a
          href={guideLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
        >
          WhatsApp Setup Guide
        </a>
      )}
      <span className="text-gray-500 text-sm">&copy; 2025 Your Company</span>
    </div>
  );
};
