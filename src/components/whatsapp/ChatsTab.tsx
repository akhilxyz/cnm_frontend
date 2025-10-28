import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Paperclip, Smile, MessageSquare, Plus, X, Loader2, Check, CheckCheck, XCircle, Info } from "lucide-react";
import { WAApi } from "../../api/whatsapp.api";
import { socket } from "../../socket/server";
import { MediaRenderer } from "./MediaRenderer";
import { TemplatePlaceholderModal } from "./SendTemplateModal";
import { useAuthStore } from "../../store/useAuthStore";

export const ChatsTab = ({ setActiveTab }: any) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);


  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  const { user } = useAuthStore()


  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await WAApi.getTemplatesList(); // make sure WAApi has this method

      const approvedTemplates = res?.responseObject?.data.filter(
        (template: any) => template.status === "APPROVED"
      );
      setTemplates(approvedTemplates || []);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
    setLoading(false)
  };

  // Fetch templates once
  useEffect(() => {
    if (showTemplateModal) {
      fetchTemplates();
    }
  }, [showTemplateModal]);

  const handleSendTemplateWithValues = (values: Record<string, string>) => {
    if (!selectedTemplate || !selectedChat) return;

    // 🧩 Fill in template variables ({{key}}) with user-provided values
    const filledComponents = selectedTemplate.components.map((c: any) => {
      if (c.type === "BODY" && c.text) {
        let filledText = c.text;
        Object.entries(values).forEach(([key, val]) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
          filledText = filledText.replace(regex, val);
        });
        return { ...c, text: filledText };
      }
      return c;
    });

    // 🧩 WhatsApp Template Payload (Meta-compliant)
    const payload: any = {
      templateMeta: selectedTemplate,
      contactId: selectedChat.contactId,
      messageType: "template",
      templateName: selectedTemplate.name,
      languageCode: selectedTemplate.language || "en_US",
      components: filledComponents.map((c: any) => {
        if (c.type === "BODY") {
          return {
            type: "BODY",
            parameters: Object.values(values).map((v) => ({
              type: "text",
              text: v,
            })),
          };
        } else if (c.type === "HEADER" && c.format && c.example) {
          // handle media or text headers dynamically
          const headerParam =
            c.format === "IMAGE"
              ? {
                type: "image",
                image: { id: c.example.header_handle?.[0] },
              }
              : {
                type: "text",
                text: c.text || "",
              };
          return {
            type: "HEADER",
            format: c.format,
            parameters: [headerParam],
          };
        }
        return c;
      }),
    };

    // ✅ Send to backend API (aligned with Joi schema)
    WAApi.Chat.sendTemplateMessage(payload);

    // Reset UI state
    setShowPlaceholderModal(false);
    setSelectedTemplate(null);
  };




  const downloadMedia = async (mediaId: string, download = true) => {
    try {


      const { responseObject } = await WAApi.downloadMedia(mediaId);

      if (!download) {
        return responseObject
      }

      const { base64, mimeType } = responseObject

      // Create a blob from base64
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whatsapp_media.${mimeType.split("/")[1]}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to download media:", error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = (newMessage: any) => {
      // Normalize contactId to string for reliable comparison
      const msgContactId = String(newMessage.contactId);
      const selectedContactId = selectedChat ? String(selectedChat.contactId) : null;

      // If the message belongs to the currently opened chat, append to messages
      if (selectedContactId && selectedContactId === msgContactId) {
        setMessages((prev) => [...prev, newMessage]);
      }

      // Update chats list
      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (chat) => String(chat.contactId) === msgContactId
        );

        if (existingChatIndex !== -1) {
          // Update chat entry
          const existingChat = prevChats[existingChatIndex];
          const isCurrentChat = selectedContactId === msgContactId;

          const updatedChat = {
            ...existingChat,
            lastMessage: newMessage.content,
            lastMessageTime: new Date().toISOString(),
            status: isCurrentChat ? "read" : "received",
            unreadCount: isCurrentChat
              ? 0
              : (existingChat.unreadCount || 0) + 1,
          };

          // Move chat to top
          const updatedChats = [...prevChats];
          updatedChats.splice(existingChatIndex, 1);
          return [updatedChat, ...updatedChats];
        }

        // If chat doesn’t exist yet — add new one
        return [
          {
            contactId: msgContactId,
            name: newMessage.senderName || "Unknown Contact",
            lastMessage: newMessage.content,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 1,
            status: "received",
          },
          ...prevChats,
        ];
      });
    };

    // Set up listener once
    socket.on("private_message", handlePrivateMessage);
    if (user?.id) {
      socket.emit("connect-me", user.id);
      console.log("USER CONNECTED")
    }




    // Clean up listener to avoid duplicates
    return () => {
      socket.off("private_message", handlePrivateMessage);
    };
  }, [selectedChat, window.location]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.contactId);
      markChatAsRead(selectedChat.contactId);
    }
  }, [selectedChat]);

  // 🧾 Get all conversations
  const fetchChats = async () => {
    try {
      setLoadingChats(true)
      const res = await WAApi.Chat.getConversations();
      setChats(res.responseObject || []);

      // received
    } catch (err) {
      console.error("Failed to fetch chats", err);
    } finally {
      setLoadingChats(false)
    }
  };

  // 💬 Get chat messages
  const fetchMessages = async (contactId: number) => {
    try {
      const res = await WAApi.Chat.getChatHistory(contactId);
      // setMessages(res?.responseObject?.chats || []);
      const chatMessages = res?.responseObject?.chats || [];

      // Sort ascending by timestamp
      chatMessages.sort(
        (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );


      setMessages(chatMessages);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  // 🚀 Send message
  // 🚀 Send message with optimistic update
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const tempMsg = {
      id: Date.now(), // temporary ID
      contactId: selectedChat.contactId,
      content: newMessage.trim(),
      direction: "outbound",
      messageType: "text",
      timestamp: new Date().toISOString(),
      status: "sending", // 👈 status for optimistic UI
    };

    // Add the message locally
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    try {
      const res = await WAApi.Chat.sendMessage({
        contactId: selectedChat.contactId,
        messageType: "text",
        content: newMessage.trim(),
      });

      // ✅ Update message status to sent
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsg.id ? { ...m, status: "sent" } : m
        )
      );

      fetchChats(); // refresh chats list
    } catch (err) {
      console.error("Error sending message:", err);

      // ❌ Update status to failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsg.id ? { ...m, status: "failed" } : m
        )
      );
    }
  };


  // 📩 Mark chat messages as read
  const markChatAsRead = async (contactId: number) => {
    try {
      await WAApi.Chat.markAsRead(contactId);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  // 👤 Open modal and fetch contacts
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    await fetchContactsList();
  };

  const fetchContactsList = async () => {
    try {
      const res = await WAApi.fetchContactsList(1, 50, contactSearch);
      setContacts(res?.contacts || []);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  };

  const startNewChat = (contact: any) => {
    const existing = chats.find((c) => c.contactId === contact.id);
    if (existing) {
      setSelectedChat(existing);
    } else {
      const newChat: any = {
        contactId: contact?.id,
        name: contact?.name,
        phoneNumber: contact?.phoneNumber,
        lastMessage: "",
        lastMessageTime: null,
        unreadCount: 0,
      };
      newChat.contact = {
        id: contact?.id,
        name: contact?.name,
        phoneNumber: contact?.phoneNumber,
      }
      setChats((prev) => [newChat, ...prev]);
      setSelectedChat(newChat);
    }
    setShowNewChatModal(false);
  };

  const filteredChats = chats.filter((chat) => {
    return chat?.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  }
  );

  const onClickUserChat = async (chat: any) => {
    setSelectedChat(chat)
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.contactId === chat.contactId
          ? { ...c, unreadCount: 0, status: "read" }
          : c
      )
    );
    //  await fetchChats()
  }

  return (
    <div className="flex h-[calc(100vh-240px)] relative">
      {/* LEFT SIDEBAR */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Chats</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openNewChatModal}
            className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {loadingChats ? (
          // Skeleton placeholder while loading chats
          <div className="space-y-3 p-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 p-3 border-b border-gray-100"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="h-3 w-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.contactId}
              onClick={() => onClickUserChat(chat)}
              className={`p-4 cursor-pointer border-b border-gray-100 ${selectedChat?.contactId === chat.contactId ? "bg-emerald-50" : ""
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  {chat?.contact?.name?.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{chat.contact?.name}</span>
                    {chat.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {chat.lastMessage
                      ? chat.lastMessage.length > 20
                        ? chat.lastMessage.substring(0, 20) + "...."
                        : chat.lastMessage
                      : "No messages yet"}
                  </div>
                </div>
                {chat?.unreadCount > 0 && (
                  <div className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5">
                    {chat?.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">No chats yet</div>
        )}

      </div>

      {/* RIGHT CHAT PANEL */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between gap-3">
              {/* Avatar & Contact Info */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedChat?.contact?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChat?.contact?.name}</h3>
                  <p className="text-sm text-gray-500">{selectedChat?.contact?.phoneNumber}</p>
                </div>
              </div>

              {/* Info Text on Right */}
              <div className="flex items-start gap-2 max-w-xs">
                <Info style={{ cursor: "pointer" }} className="w-10 h-4 text-gray-400 mt-1" onClick={() => setActiveTab("guide")} />
                <p className="text-xs text-gray-500">
                  You cannot reply until the user initiates the conversation. Incoming messages will only be received once the webhook is set up in your Meta App.
                </p>
              </div>
            </div>
            {/* Chat Messages */}
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 chat-bg">
              <AnimatePresence>
                {messages?.map((msg: any, index: number) => (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`mb-4 flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl ${msg.direction === "outbound"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                        : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                        }`}
                    >
                      {/* ===== Message Content ===== */}
                      {msg.messageType === "template" ? (
                        <div className="text-sm break-words whitespace-pre-line">
                          {msg.content}
                        </div>
                      ) : msg.messageType === "text" ? (
                        <p className="text-sm break-words">{msg.content}</p>
                      ) : (
                        <MediaRenderer msg={msg} downloadMedia={downloadMedia} />
                      )}

                      {/* ===== Timestamp + Status ===== */}
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <p
                          className={`text-xs ${msg.direction === "outbound"
                            ? "text-emerald-100"
                            : "text-gray-500"
                            }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {/* Status for outbound messages */}
                        {msg.direction === "outbound" && (
                          <div className="ml-1 flex items-center">
                            {msg.status === "sending" && (
                              <Loader2 className="w-3.5 h-3.5 text-emerald-100 animate-spin" />
                            )}
                            {msg.status === "sent" && (
                              <Check
                                className="w-3.5 h-3.5 text-emerald-100"
                                strokeWidth={2.5}
                              />
                            )}
                            {msg.status === "delivered" && (
                              <CheckCheck
                                className="w-3.5 h-3.5 text-emerald-100"
                                strokeWidth={2.5}
                              />
                            )}
                            {msg.status === "failed" && (
                              <XCircle
                                className="w-3.5 h-3.5 text-red-400"
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>




            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-2">
              <Smile className="w-6 h-6 text-gray-600 cursor-pointer" />
              <Paperclip className="w-6 h-6 text-gray-600 cursor-pointer" />

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />

              {/* Templates Button */}
              <button
                onClick={() => setShowTemplateModal(true)}
                className="bg-gray-200 p-3 rounded-xl hover:bg-gray-300"
                title="Send Template"
              >
                T
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/30"
              >
                <Send className="w-6 h-6" />
              </motion.button>
            </div>

            {/* <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-2">
              <Smile className="w-6 h-6 text-gray-600 cursor-pointer" />
              <Paperclip className="w-6 h-6 text-gray-600 cursor-pointer" />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/30"
              >
                <Send className="w-6 h-6" />
              </motion.button>
            </div> */}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl w-[500px] p-6 relative shadow-xl"
            >
              <button
                onClick={() => setShowTemplateModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-semibold mb-4">Select a Template</h2>

              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-gray-500 text-sm">No templates found.</p>
              ) : (
                <ul className="space-y-3 max-h-[400px] overflow-y-auto">
                  {templates.map((t) => (
                    <li
                      key={t.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedTemplate(t);
                        setShowPlaceholderModal(true);
                        setShowTemplateModal(false);
                      }}
                    >
                      <h4 className="font-medium">{t.name}</h4>
                      <p className="text-sm text-gray-500">
                        {t.category} • {t.language}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder Modal */}
      <AnimatePresence>
        {showPlaceholderModal && selectedTemplate && (
          <TemplatePlaceholderModal
            template={selectedTemplate}
            onClose={() => setShowPlaceholderModal(false)}
            onSend={handleSendTemplateWithValues}
          />
        )}
      </AnimatePresence>


      {/* 🟢 New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-[400px] shadow-xl relative"
            >
              <button
                onClick={() => setShowNewChatModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Start New Chat</h3>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && fetchContactsList()}
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {contacts.length > 0 ? (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => startNewChat(c)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-emerald-500 text-white flex items-center justify-center rounded-full font-semibold">
                        {c?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{c.name}</h4>
                        <p className="text-sm text-gray-500">{c.phoneNumber}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No contacts found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
