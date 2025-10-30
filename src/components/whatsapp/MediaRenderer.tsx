import { Loader2, Download, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export const MediaRenderer = ({
  msg,
  downloadMedia,
}: {
  msg: any;
  downloadMedia: (id: string, download: boolean) => Promise<any>;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastDownload, setLastDownload] = useState(0);

  const fetchData = async (mediaId: string) => {
    try {
      const msg: any = await downloadMedia(mediaId, false);
      const url = `data:${msg.mimeType};base64,${msg.base64}`;
      setDataUrl(url);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(true);
    }
  };

  useEffect(() => {
    if (msg.mediaId) fetchData(msg.mediaId);
  }, [msg.mediaId]);

  const handleDownload = useCallback(async () => {
    const now = Date.now();
    if (now - lastDownload < 2000) return; // throttle 2s
    setLastDownload(now);

    if (!msg.mediaId) return;
    try {
      setDownloading(true);
      await downloadMedia(msg.mediaId, true);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  }, [msg.mediaId, lastDownload, downloadMedia]);

  // ---------- UI ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center w-52 h-44 bg-gray-100 rounded-xl border border-gray-200 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-52 h-44 bg-gray-100 rounded-xl border border-gray-200 shadow-sm">
        <span className="text-gray-500 text-sm font-medium">
          Failed to load media
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Preview Card */}
      <div
        onClick={() => setModalOpen(true)}
        className="relative w-52 h-44 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          {msg.messageType === "image" && (
            <img
              src={dataUrl}
              alt={msg.caption || "Image"}
              className="object-cover w-full h-full"
            />
          )}
          {msg.messageType === "sticker" && (
            <img
              src={dataUrl}
              alt={msg.caption || "Sticker"}
              className="object-contain w-28 h-28"
            />
          )}
          {msg.messageType === "video" && (
            <video
              src={dataUrl}
              className="object-cover w-full h-full"
              muted
              playsInline
            />
          )}
          {msg.messageType === "audio" && (
            <div className="px-4">
              <audio controls src={dataUrl} className="w-full" />
            </div>
          )}
          {msg.messageType === "document" && (
            <div className="flex flex-col items-center">
              <Download className="w-6 h-6 text-emerald-600 mb-2" />
              <span className="text-emerald-700 font-medium text-sm truncate">
                {msg.fileName || "Document"}
              </span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
      </div>

      {/* Modal */}
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col items-center">
            {/* Media container with overlay close button */}
            <div className="relative w-full flex items-center justify-center bg-black">
              {/* Media */}
              {msg.messageType === "image" && (
                <img
                  src={dataUrl}
                  alt={msg.caption || "Image"}
                  className="max-h-[80vh] object-contain rounded-none"
                />
              )}
              {msg.messageType === "sticker" && (
                <img
                  src={dataUrl}
                  alt={msg.caption || "Sticker"}
                  className="max-h-[80vh] object-contain rounded-none"
                />
              )}
              {msg.messageType === "video" && (
                <video
                  controls
                  src={dataUrl}
                  className="max-h-[80vh] rounded-none"
                />
              )}
              {msg.messageType === "audio" && (
                <div className="p-6 w-full bg-white">
                  <audio controls src={dataUrl} className="w-full" />
                </div>
              )}
              {msg.messageType === "document" && (
                <div className="flex flex-col items-center justify-center p-6 bg-white">
                  <a
                    href={dataUrl}
                    download={msg.fileName || `document.${msg.mimeType.split("/")[1]}`}
                    className="text-emerald-600 font-medium underline text-sm"
                  >
                    {msg.fileName || "Download Document"}
                  </a>
                </div>
              )}

              {/* Floating Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Download Button */}
            {msg.mediaId && msg.messageType !== "document" && (
              <div className="w-full flex justify-center py-4 bg-white">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-full shadow-sm transition ${downloading
                      ? "bg-emerald-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                >
                  {downloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloading ? "Downloading..." : "Download"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
};
