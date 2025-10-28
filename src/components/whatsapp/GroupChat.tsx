import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, File } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { WAApi } from '../../api/whatsapp.api';

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export const GroupChat = ({ groupId, groupName }: GroupChatProps) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'document'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() && !file) {
      toast.error('Please enter a message or select a file');
      return;
    }

    setLoading(true);
    try {
      let mediaId = null;

      // Upload media if file is selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResponse = await WAApi.uploadMedia(formData);
        if (uploadResponse.success) {
          mediaId = uploadResponse.data.id;
        }
      }

      // Send message
      const response = await WAApi.Group.sendMessage(groupId, {
        messageType: messageType,
        content: message,
        mediaId: mediaId,
        caption: file ? message : undefined,
      });

      if (response.success) {
        toast.success('Message sent successfully');
        setMessage('');
        setFile(null);
        setMessageType('text');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg">
      <h3 className="text-lg font-bold mb-4">Send to: {groupName}</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMessageType('text')}
          className={`px-4 py-2 rounded-lg ${
            messageType === 'text'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setMessageType('image')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            messageType === 'image'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Image className="w-4 h-4" />
          Image
        </button>
        <button
          onClick={() => setMessageType('document')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            messageType === 'document'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <File className="w-4 h-4" />
          Document
        </button>
      </div>

      {(messageType === 'image' || messageType === 'document') && (
        <input
          type="file"
          accept={messageType === 'image' ? 'image/*' : '*'}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 w-full px-4 py-2 border border-gray-200 rounded-lg"
        />
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={file ? "Add caption (optional)" : "Type your message..."}
        rows={4}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none mb-4"
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSendMessage}
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? 'Sending...' : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </motion.button>
    </div>
  );
};