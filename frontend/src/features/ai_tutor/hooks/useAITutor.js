import { useState, useCallback, useEffect } from 'react';
import {
  sendTutorMessage,
  fetchTutorHistory,
  fetchTutorChatById,
  deleteTutorChat,
} from '../services/aiTutorService';

function formatDate(iso) {
  if (!iso) return 'Just now';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)                  return 'Just now';
  if (diff < 3600)                return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)               return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800)              return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function useAITutor(userId) {
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeChat, setActiveChat]         = useState(null); // { id, title }
  const [messages, setMessages]             = useState([]);
  const [isTyping, setIsTyping]             = useState(false);
  const [error, setError]                   = useState(null);

  // Load history sessions on mount or when userId changes
  useEffect(() => {
    if (userId === undefined) return;
    setHistoryLoading(true);
    fetchTutorHistory(userId)
      .then((sessions) => {
        setHistory(
          sessions.map(s => ({
            id   : s._id,
            title: s.title,
            date : formatDate(s.updatedAt),
          }))
        );
      })
      .catch((err) => console.warn('[useAITutor] history load failed:', err.message))
      .finally(() => setHistoryLoading(false));
  }, [userId]);

  const startNewChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setError(null);
  }, []);

  const selectChat = useCallback(async (chatItem) => {
    setActiveChat(chatItem);
    setMessages([]);
    setError(null);
    setIsTyping(true);

    try {
      const chatData = await fetchTutorChatById(chatItem.id);
      if (chatData?.messages) {
        setMessages(
          chatData.messages.map((m, idx) => ({
            id     : `${chatItem.id}-${idx}`,
            role   : m.role,
            content: m.content,
            time   : m.time || '•',
          }))
        );
      }
    } catch (err) {
      setError('Could not load this conversation.');
    } finally {
      setIsTyping(false);
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id     : `tmp-u-${Date.now()}`,
      role   : 'user',
      content: text.trim(),
      time   : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      const result = await sendTutorMessage({
        chatId : activeChat?.id,
        userId,
        message: text.trim(),
      });

      const aiMsg = {
        id     : `tmp-a-${Date.now()}`,
        role   : 'ai',
        content: result.reply,
        time   : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Update activeChat and history sidebar
      if (!activeChat) {
        const newChatInfo = { id: result.chatId, title: result.title, date: 'Just now' };
        setActiveChat(newChatInfo);
        setHistory(prev => [newChatInfo, ...prev]);
      } else {
        setHistory(prev =>
          prev.map(item => item.id === activeChat.id ? { ...item, date: 'Just now' } : item)
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  }, [activeChat, userId, isTyping]);

  const deleteChat = useCallback(async (chatId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await deleteTutorChat(chatId);
      setHistory(prev => prev.filter(item => item.id !== chatId));
      if (activeChat?.id === chatId) {
        startNewChat();
      }
    } catch (err) {
      console.warn('Could not delete chat session:', err);
    }
  }, [activeChat, startNewChat]);

  return {
    history,
    historyLoading,
    activeChat,
    messages,
    isTyping,
    error,
    startNewChat,
    selectChat,
    sendMessage,
    deleteChat,
  };
}
