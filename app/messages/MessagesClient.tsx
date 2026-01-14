"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Conversation {
  id: string;
  title: string;
  campaign_id: string | null;
  last_message_at: string | null;
  creator_profile?: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    youtube_profile_image_url: string | null;
  };
  brand_profile?: {
    id: string;
    company_name: string | null;
    logo_url: string | null;
  };
  campaign?: {
    id: string;
    name: string;
  };
  unread_count: number;
  last_message: {
    content: string;
    sender_type: string;
    created_at: string;
  } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: "brand" | "creator";
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  attachments?: {
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
  }[];
}

export default function MessagesClient({ userType }: { userType: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
          
          // Mark as read if from other party
          if (newMsg.sender_type !== userType) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    // Typing indicator subscription
    const typingChannel = supabase
      .channel(`typing:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const indicator = payload.new as any;
            if (indicator.user_type !== userType) {
              setOtherUserTyping(true);
              // Auto-clear after 3 seconds
              setTimeout(() => setOtherUserTyping(false), 3000);
            }
          } else if (payload.eventType === "DELETE") {
            setOtherUserTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
    };
  }, [selectedConversation?.id, userType]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    setLoading(true);
    const res = await fetch("/api/messages/conversations");
    const data = await res.json();
    
    if (data.conversations) {
      setConversations(data.conversations);
    }
    setLoading(false);
  };

  const loadMessages = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    const res = await fetch(`/api/messages/conversations/${conversation.id}`);
    const data = await res.json();
    
    if (data.messages) {
      setMessages(data.messages);
      setProfileId(data.profileId);
    }

    // Update unread count locally
    setConversations(prev => 
      prev.map(c => c.id === conversation.id ? { ...c, unread_count: 0 } : c)
    );
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: selectedConversation.id,
        content: newMessage.trim(),
      }),
    });

    const data = await res.json();
    
    if (data.message) {
      // Message will be added via real-time subscription
      setNewMessage("");
      clearTypingIndicator();
    } else if (data.error) {
      alert(data.error);
    }

    setSending(false);
  };

  const handleTyping = () => {
    if (!selectedConversation) return;

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          is_typing: true,
        }),
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      clearTypingIndicator();
    }, 2000);
  };

  const clearTypingIndicator = () => {
    if (!selectedConversation) return;
    
    setIsTyping(false);
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: selectedConversation.id,
        is_typing: false,
      }),
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getOtherPartyName = (conv: Conversation) => {
    if (userType === "brand") {
      return conv.creator_profile?.display_name || "Creator";
    }
    return conv.brand_profile?.company_name || "Brand";
  };

  const getOtherPartyImage = (conv: Conversation) => {
    if (userType === "brand") {
      return conv.creator_profile?.profile_photo_url || conv.creator_profile?.youtube_profile_image_url;
    }
    return conv.brand_profile?.logo_url;
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Conversation List */}
      <div className="w-80 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[var(--color-text-tertiary)]">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-tertiary)]">
              {userType === "brand" ? (
                <>
                  <div className="text-4xl mb-3">💬</div>
                  <p className="mb-2">No conversations yet</p>
                  <Link
                    href="/dashboard/brand/discover"
                    className="text-[var(--color-accent)] hover:underline text-sm"
                  >
                    Discover creators to message
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📬</div>
                  <p className="mb-2 font-medium text-[var(--color-text-primary)]">Your inbox is empty</p>
                  <p className="text-sm">
                    When brands reach out to you about campaigns or partnerships, their messages will appear here.
                  </p>
                  <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-left">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">💡 Pro tip</p>
                    <p className="text-xs">
                      Express interest in campaigns to increase your chances of getting contacted by brands!
                    </p>
                  </div>
                  <Link
                    href="/dashboard/creator/opportunities"
                    className="inline-block mt-4 text-[var(--color-accent)] hover:underline text-sm"
                  >
                    Browse opportunities →
                  </Link>
                </>
              )}
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadMessages(conv)}
                className={`w-full p-4 text-left border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors ${
                  selectedConversation?.id === conv.id ? "bg-[var(--color-bg-tertiary)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {getOtherPartyImage(conv) ? (
                    <img
                      src={getOtherPartyImage(conv)!}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
                      {userType === "brand" ? "👤" : "🏢"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {getOtherPartyName(conv)}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] truncate">
                      {conv.title}
                    </p>
                    {conv.last_message && (
                      <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-1">
                        {conv.last_message.sender_type === userType ? "You: " : ""}
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>

                  {conv.unread_count > 0 && (
                    <span className="bg-[var(--color-accent)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col bg-[var(--color-bg-primary)]">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-3">
                {getOtherPartyImage(selectedConversation) ? (
                  <img
                    src={getOtherPartyImage(selectedConversation)!}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
                    {userType === "brand" ? "👤" : "🏢"}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-[var(--color-text-primary)]">
                    {getOtherPartyName(selectedConversation)}
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {selectedConversation.title}
                    {selectedConversation.campaign && (
                      <span className="text-[var(--color-accent)]">
                        {" "}• {selectedConversation.campaign.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_type === userType;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-sm ${
                                isOwn ? "text-white/80 hover:text-white" : "text-[var(--color-accent)] hover:underline"
                              }`}
                            >
                              📎 {att.file_name}
                            </a>
                          ))}
                        </div>
                      )}

                      <div
                        className={`flex items-center gap-1 mt-1 text-xs ${
                          isOwn ? "text-white/70" : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        <span>{formatTime(message.created_at)}</span>
                        {isOwn && message.read_at && (
                          <span>✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              {/* Check if creator can reply (brand must have sent first) */}
              {userType === "creator" && messages.filter(m => m.sender_type === "brand").length === 0 ? (
                <div className="text-center py-2 text-[var(--color-text-tertiary)] text-sm">
                  <p>Waiting for brand to send the first message...</p>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{ minHeight: "40px", maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-tertiary)]">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
