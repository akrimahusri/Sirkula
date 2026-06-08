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
  
  const { messages, sendMessage, sendTypingEvent, markAsRead, isTyping, isConnected, setInitialMessages } = useChat(chatId, token);
  const [loading, setLoading] = useState(true);

  // Load History Chat
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/api/chat/${chatId}`);
        if (res.data.success) {
          setInitialMessages(res.data.data.messages);
          // Mark as read after load
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

  // Auto scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, 'text');
    setInputText('');
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-4xl mx-auto md:py-6 h-[calc(100vh-64px)] md:h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-1 bg-[#efeae2] flex flex-col md:rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-brand-dark px-4 py-3 flex items-center justify-between text-white z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              U
            </div>
            <div>
              <h2 className="font-bold text-sm md:text-base leading-tight">Obrolan Transaksi</h2>
              <p className="text-xs text-brand-light/70">{isConnected ? 'Online' : 'Menghubungkan...'}</p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-chat-pattern">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative ${isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                  <p className="text-sm text-gray-800 break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span className="text-gray-400">
                        {msg.isRead ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2 shadow-sm text-xs text-gray-500 italic">
                Sedang mengetik...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#f0f2f5] px-4 py-3 border-t border-gray-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button type="button" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
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
              className="flex-1 bg-white border-none rounded-full px-4 py-2.5 text-sm outline-none shadow-sm focus:ring-1 focus:ring-brand-green"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="p-2.5 bg-brand-green text-white rounded-full hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Chat;
