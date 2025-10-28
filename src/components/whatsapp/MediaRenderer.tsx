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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-48 h-40 bg-gray-50 border border-gray-200 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-48 h-40 bg-gray-50 border border-gray-200 rounded-xl p-3">
        <span className="text-gray-400 text-sm mb-2">Failed to load media</span>
      </div>
    );
  }

  return (
    <>
      {/* Media Preview Card */}
      <div
        onClick={() => setModalOpen(true)}
        className="relative w-48 h-40 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-md transition"
      >
        {msg.messageType === "image" && <img src={dataUrl} alt={msg.caption || "Image"} className="max-h-32 object-contain rounded-lg" />}
        {msg.messageType === "sticker" && <img src={dataUrl} alt={msg.caption || "Sticker"} className="max-h-32 object-contain rounded-lg" />}
        {msg.messageType === "video" && <video controls src={dataUrl} className="max-h-32 rounded-lg" />}
        {msg.messageType === "audio" && <audio controls src={dataUrl} className="w-full mt-2" />}
        {msg.messageType === "document" && (
          <span className="text-blue-600 underline text-sm mt-1 truncate">{msg.fileName || "Document"}</span>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-full overflow-auto p-4 flex flex-col items-center">
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Media */}
            {msg.messageType === "image" && <img src={dataUrl} alt={msg.caption || "Image"} className="max-h-[70vh] object-contain rounded-lg" />}
            {msg.messageType === "sticker" && <img src={dataUrl} alt={msg.caption || "Sticker"} className="max-h-[70vh] object-contain rounded-lg" />}
            {msg.messageType === "video" && <video controls src={dataUrl} className="max-h-[70vh] rounded-lg" />}
            {msg.messageType === "audio" && <audio controls src={dataUrl} className="w-full mt-2" />}
            {msg.messageType === "document" && (
              <a
                href={dataUrl}
                download={msg.fileName || `document.${msg.mimeType.split("/")[1]}`}
                className="text-blue-600 underline text-sm mt-1"
              >
                {msg.fileName || "Download Document"}
              </a>
            )}

            {/* Download Button */}
            {msg.mediaId && msg.messageType !== "document" && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`flex items-center gap-2 mt-4 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition ${
                  downloading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
