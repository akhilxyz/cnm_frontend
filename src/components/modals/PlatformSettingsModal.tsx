import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { platFormApi } from "../../api/platform.api";
import toast from "react-hot-toast";

type WhatsAppData = {
  phoneNumber: string;
  displayName: string;
  businessName: string;
  phoneNumberId: string;
  businessAccountId: string;
  token: string;
  apiKey: string;
};

export function PlatformSettingsModal({
  platform,
  onClose,
}: {
  platform: string;
  onClose: () => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [whatsAppData, setWhatsAppData] = useState<WhatsAppData | null>(null);

  const checkPlatFormConnected = async (platform: string) => {
    try {
      const { responseObject } = await platFormApi.isConnected(platform.toLowerCase());

      if (responseObject?.isFound && responseObject.data) {
        setIsConnected(true);
        setWhatsAppData({
          phoneNumber: responseObject.data.phoneNumber || "",
          displayName: responseObject.data.displayName || "",
          businessName: responseObject.data.businessName || "",
          phoneNumberId: responseObject.data.phoneNumberId || "",
          businessAccountId: responseObject.data.businessAccountId || "",
          token: responseObject.data.appToken || "",
          apiKey: responseObject.data.apiKey || "",
        });
      } else {
        setIsConnected(false);
        setWhatsAppData(null);
      }
    } catch (error) {
      console.log("err", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent page reload
    if (!whatsAppData) return;

    try {
      setLoading(true);

      // Call your API to save/update WhatsApp data
      const payload = {
        phone_number: whatsAppData.phoneNumber,
        display_name: whatsAppData.displayName,
        business_name: whatsAppData.businessName,
        phone_number_id: whatsAppData.phoneNumberId,
        business_account_id: whatsAppData.businessAccountId,
        token: whatsAppData.token,
        api_key: whatsAppData.apiKey,
      };

      let response;
      // if (isConnected) {
      response = await platFormApi.connectWhatsapp(payload);


      if (response.success) {
        setIsConnected(true);
        toast.success(`WhatsApp ${isConnected ? 'updated' : 'connected'} successfully!`);
        onClose();
      } else {
        toast.error("Failed to connect WhatsApp: " + response.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while connecting WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (platform.toLowerCase() === "whatsapp") {
      checkPlatFormConnected(platform);
    } else {
      setLoading(false);
    }
  }, [platform]);

  const isWhatsApp = platform.toLowerCase() === "whatsapp";

  if (loading) return null; // optionally add a loader here

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-[90%] max-w-md relative shadow-xl"
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4 text-center">
          Connect {platform}
        </h2>

        {isWhatsApp ? (
          <>
            {isConnected && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-center">
                WhatsApp is already connected.
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={whatsAppData?.phoneNumber || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  name="display_name"
                  value={whatsAppData?.displayName || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, displayName: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John's Store"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={whatsAppData?.businessName || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, businessName: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John's Shop"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
                <input
                  type="text"
                  name="phone_number_id"
                  value={whatsAppData?.phoneNumberId || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, phoneNumberId: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Phone Number ID"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Business Account ID</label>
                <input
                  type="text"
                  name="business_account_id"
                  value={whatsAppData?.businessAccountId || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, businessAccountId: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Business Account ID"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Token</label>
                <input
                  type="text"
                  name="token"
                  value={whatsAppData?.token || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, token: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Token"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">API Key</label>
                <input
                  type="text"
                  name="api_key"
                  value={whatsAppData?.apiKey || ""}
                  onChange={(e) =>
                    setWhatsAppData((prev: any) => ({ ...prev, apiKey: e.target.value }))
                  }
                  className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter API Key"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
              >
                {isConnected ? "Update Connection" : "Save & Connect"}
              </button>
            </form>
          </>
        ) : (
          // Other platforms: show upgrade message
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="flex flex-col items-center gap-4 bg-gray-50 rounded-2xl p-8 shadow-md border border-gray-200">
              {/* Info icon */}
              <svg
                className="w-12 h-12 text-yellow-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"
                />
              </svg>

              {/* Main message */}
              <h3 className="text-lg font-semibold text-gray-800 text-center">
                Feature Unavailable
              </h3>

              {/* Supporting text */}
              <p className="text-center text-gray-600 text-sm max-w-xs">
                This feature is not available in the basic plan. Upgrade your plan to unlock this
                functionality.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
