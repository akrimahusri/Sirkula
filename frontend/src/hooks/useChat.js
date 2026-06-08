import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useChat = (chatId, token) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    if (!token) return;

    // Inisiasi socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true, // Auto reconnect
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // Join room jika chatId tersedia
      if (chatId) {
        socketRef.current.emit('join_chat', { chatId });
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen incoming messages
    socketRef.current.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen typing indicator
    socketRef.current.on('user_typing', ({ isTyping: typingStatus }) => {
      setIsTyping(typingStatus);
    });

    // Listen message read status
    socketRef.current.on('message_read', ({ userId }) => {
      setMessages((prev) => 
        prev.map(msg => 
          msg.senderId !== userId ? { ...msg, isRead: true } : msg
        )
      );
    });

    // Cleanup saat unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatId, token]);

  const sendMessage = useCallback((content, type = 'text') => {
    if (socketRef.current && isConnected && chatId) {
      const msgData = { chatId, content, type };
      socketRef.current.emit('send_message', msgData);
    }
  }, [chatId, isConnected]);

  const sendTypingEvent = useCallback(() => {
    if (socketRef.current && isConnected && chatId) {
      socketRef.current.emit('typing', { chatId, isTyping: true });
      
      // Auto clear typing status after 2 seconds
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', { chatId, isTyping: false });
      }, 2000);
    }
  }, [chatId, isConnected]);

  const markAsRead = useCallback(() => {
    if (socketRef.current && isConnected && chatId) {
      socketRef.current.emit('mark_read', { chatId });
    }
  }, [chatId, isConnected]);

  // Expose setter for messages (e.g. initial load from REST API)
  const setInitialMessages = useCallback((initialMessages) => {
    setMessages(initialMessages);
  }, []);

  return {
    messages,
    sendMessage,
    sendTypingEvent,
    markAsRead,
    isTyping,
    isConnected,
    setInitialMessages
  };
};

export default useChat;
