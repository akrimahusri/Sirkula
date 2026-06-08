import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useChat from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { Send, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const Chat = () => {
  const { chatId } = useParams();
  const { user, token } = useAuth();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const {
    messages,
    sendMessage,
    sendTypingEvent,
    markAsRead,
    isTyping,
    isConnected,
    setInitialMessages,
  } = useChat(chatId, token);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/api/chat/${chatId}`);

        if (res.data.success) {
          setInitialMessages(res.data.data.messages);
          markAsRead();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) fetchHistory();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    sendMessage(inputText, 'text');
    setInputText('');
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-br from-green-50 via-green-100 to-green-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg">
              U
            </div>

            <div>
              <h2 className="font-semibold text-lg leading-tight">
                Mitra Pengumpul
              </h2>

              <p className="text-xs text-green-100">
                {isConnected ? 'Aktif sekarang' : 'Menghubungkan...'}
              </p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-5 custom-scrollbar">

          {messages.map((msg, idx) => {
            const currentUserId =
              user?.id ||
              user?._id;

            const senderId =
              msg?.senderId ||
              msg?.sender ||
              msg?.sender?._id;

            const isMe =
              String(senderId) === String(currentUserId);

            return (
              <div
                key={idx}
                className={`w-full flex ${
                  isMe
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`
                    max-w-[75%]
                    px-4
                    py-3
                    shadow-md
                    relative
                    break-words
                    ${
                      isMe
                        ? 'bg-gradient-to-r from-green-400 to-green-500 text-white ml-auto rounded-3xl rounded-br-lg'
                        : 'bg-white/90 backdrop-blur-sm mr-auto rounded-3xl rounded-bl-lg'
                    }
                  `}
                >
                  <p
                    className={`text-sm break-words ${
                      isMe
                        ? 'text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </p>

                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span
                      className={`text-[10px] ${
                        isMe
                          ? 'text-green-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString(
                        'id-ID',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>

                    {isMe && (
                      <span>
                        {msg.isRead ? (
                          <CheckCheck
                            size={14}
                            className="text-green-100"
                          />
                        ) : (
                          <Check
                            size={14}
                            className="text-green-100"
                          />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-4 py-2 shadow-sm text-xs text-gray-500 italic">
                Sedang mengetik...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 border-t border-green-100">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              className="p-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <ImageIcon size={24} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                sendTypingEvent();
              }}
              placeholder="Ketik pesan..."
              className="flex-1 bg-green-50 rounded-full px-5 py-3 text-sm outline-none border border-green-100 focus:ring-2 focus:ring-green-300"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Chat;