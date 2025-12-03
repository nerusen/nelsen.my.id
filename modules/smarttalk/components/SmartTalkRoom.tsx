"use client";

import useSWR, { mutate } from "swr";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import SmartTalkAuth from "./SmartTalkAuth";
import SmartTalkInput from "./SmartTalkInput";
import SmartTalkList from "./SmartTalkList";
import SmartTalkItemSkeleton from "./SmartTalkItemSkeleton";
import ClearChatConfirmPopup from "./ClearChatConfirmPopup";

import { MessageProps } from "@/common/types/chat";
import { fetcher } from "@/services/fetcher";
import { createClient } from "@/common/utils/client";
import useNotif from "@/hooks/useNotif";

export const SmartTalkRoom = () => {
  const { data: session } = useSession();
  const { data, isLoading, error } = useSWR(
    session?.user?.email ? `/api/smart-talk?email=${session?.user?.email}` : null,
    fetcher
  );

  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isReply, setIsReply] = useState({ is_reply: false, name: "" });
  const [showPopupFor, setShowPopupFor] = useState<string | null>(null);
  const [thinkingMessageId, setThinkingMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("minimax/minimax-01");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const supabase = createClient();

  const notif = useNotif();

  const handleClickReply = (name: string) => {
    if (!session?.user) return notif("Please sign in to reply");
    setIsReply({ is_reply: true, name });
  };

  const handleCancelReply = () => {
    setIsReply({ is_reply: false, name: "" });
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClearChat = () => {
    setMessages([]);
    setShowClearConfirm(false);
    // Invalidate SWR cache to refresh data
    mutate(`/api/smart-talk?email=${session?.user?.email}`);
  };

  const handleSendMessage = async (message: string) => {
    if (!session?.user?.email) return;

    console.log("🚀 Starting to send message:", message.substring(0, 50) + "...");

    const messageId = uuidv4();
    const newMessageData = {
      id: messageId,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      message,
      is_reply: isReply.is_reply,
      reply_to: isReply.name,
      is_show: true,
      created_at: new Date().toISOString(),
      is_ai: false, // User message
      user_email: session.user.email, // Important for filtering
    };

    console.log("📝 Adding user message to UI:", messageId);

    // Optimistic update - add message immediately to UI
    setMessages((prevMessages) => [
      ...prevMessages,
      newMessageData as MessageProps,
    ]);

    try {
      console.log("📡 Sending message to API...");
      const response = await axios.post("/api/smart-talk", newMessageData);
      console.log("✅ Message sent successfully:", response.data);
      notif("Message sent successfully");

      // Add thinking message immediately
      const thinkingId = uuidv4();
      setThinkingMessageId(thinkingId);
      const thinkingMessage = {
        id: thinkingId,
        name: "AI Assistant",
        email: "ai@smarttalk.com",
        image: "/images/satria.jpg", // AI avatar
        message: "Sedang berpikir...",
        is_reply: false,
        reply_to: undefined,
        is_show: true,
        created_at: new Date().toISOString(),
        is_ai: true,
        is_thinking: true,
        user_email: session.user.email, // Important for filtering
      };

      console.log("🤔 Adding thinking message to UI:", thinkingId);

      // Add thinking message immediately
      setMessages((prevMessages) => [
        ...prevMessages,
        thinkingMessage as MessageProps,
      ]);

      // Get AI response - only call once
      console.log("🤖 Requesting AI response...");
      await getAIResponse(message, thinkingId, selectedModel);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      notif("Failed to send message");
      // Remove optimistic message on error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
      // Also remove thinking message on error
      if (thinkingMessageId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== thinkingMessageId)
        );
        setThinkingMessageId(null);
      }
    }
  };

  const getAIResponse = async (userMessage: string, thinkingId: string, model: string) => {
    try {
      console.log("🤖 Sending AI response request for message:", userMessage.substring(0, 50) + "...");

      const response = await axios.post("/api/smart-talk", {
        userMessage,
        email: session?.user?.email,
        model,
        thinkingId
      });

      console.log("✅ AI response request sent successfully");

      // The real-time subscription will handle updating the UI when the AI response is inserted
      // No need for additional polling since we have reliable real-time updates

    } catch (error) {
      console.error("❌ Error getting AI response:", error);
      notif("Failed to get AI response");
      // Remove thinking message on error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== thinkingId)
      );
      setThinkingMessageId(null);
    }
  };

  // Add a timeout to remove thinking message if AI response takes too long
  useEffect(() => {
    if (thinkingMessageId) {
      const timeout = setTimeout(() => {
        console.log("AI response timeout - removing thinking message");
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== thinkingMessageId)
        );
        setThinkingMessageId(null);
        notif("AI response timed out. Please try again.");
      }, 45000); // Reduced to 45 seconds for better UX

      return () => clearTimeout(timeout);
    }
  }, [thinkingMessageId, notif]);

  useEffect(() => {
    if (data) {
      // Merge server data with local messages to preserve optimistic updates
      setMessages((currentMessages) => {
        // Create a map of existing message IDs for quick lookup
        const existingIds = new Set(currentMessages.map(msg => msg.id));

        // Filter out server messages that we already have locally (to preserve optimistic updates)
        const newServerMessages = data.filter((serverMsg: MessageProps) => !existingIds.has(serverMsg.id));

        // Combine existing messages with new server messages
        return [...currentMessages, ...newServerMessages];
      });
    }
  }, [data]);

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Smart Talk fetch error:", error);
    }
    console.log("Smart Talk data:", data);
    console.log("Smart Talk loading:", isLoading);
  }, [data, error, isLoading]);

  // Enhanced real-time subscription for reliable message updates
  useEffect(() => {
    if (!session?.user?.email) return;

    console.log("🔄 Setting up enhanced real-time subscription for user:", session?.user?.email);

    let channel: any = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const setupSubscription = () => {
      const channelName = `smart-talk-${session?.user?.email}-${Date.now()}`;
      console.log("📡 Creating channel:", channelName);

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "smart_talk_messages",
            filter: `user_email=eq.${session?.user?.email}`,
          },
          (payload: any) => {
            console.log("📨 Real-time INSERT received:", {
              id: payload.new.id,
              is_ai: payload.new.is_ai,
              is_thinking: payload.new.is_thinking,
              user_email: payload.new.user_email,
              message: payload.new.message?.substring(0, 50) + "...",
              thinkingMessageId: thinkingMessageId
            });

            const newMessage = payload.new as MessageProps;

            // Check if this message is for current user
            if (newMessage.user_email !== session?.user?.email) {
              console.log("🚫 Message not for this user");
              return;
            }

            setMessages((prevMessages) => {
              // Check if we already have this message (to avoid duplicates)
              const exists = prevMessages.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log("📝 Message already exists in UI, skipping duplicate");
                return prevMessages;
              }

              // If this is AI message and we have thinking message, replace it
              if (newMessage.is_ai && thinkingMessageId) {
                console.log("🔄 Replacing thinking message with AI response");
                const updatedMessages = prevMessages.map((msg: MessageProps) =>
                  msg.id === thinkingMessageId
                    ? { ...newMessage, is_thinking: false }
                    : msg
                );
                setThinkingMessageId(null);
                console.log("✅ AI response displayed via real-time");
                return updatedMessages;
              }

              // Add new message (user or AI) to the end
              console.log("📝 Adding new message from real-time:", newMessage.id, "is_ai:", newMessage.is_ai);
              return [...prevMessages, newMessage];
            });
          }
        )
        .subscribe((status: string, err: any) => {
          console.log("🔗 Subscription status:", status, err);

          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time');
            reconnectAttempts = 0; // Reset reconnect attempts on success
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error('❌ Subscription failed, attempting to reconnect...');

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds

              reconnectTimeout = setTimeout(() => {
                if (channel) {
                  supabase.removeChannel(channel);
                  channel = null;
                }
                setupSubscription();
              }, delay);
            } else {
              console.error('❌ Max reconnection attempts reached');
            }
          }
        });
    };

    setupSubscription();

    return () => {
      console.log("🧹 Cleaning up real-time subscription");
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [supabase, session?.user?.email, thinkingMessageId]);

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <SmartTalkItemSkeleton />
      ) : (
        <SmartTalkList
          messages={messages}
          onClickReply={handleClickReply}
          showPopupFor={showPopupFor}
        />
      )}

      {session ? (
        <SmartTalkInput
          onSendMessage={handleSendMessage}
          onCancelReply={handleCancelReply}
          replyName={isReply.name}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onClearChat={handleClearChat}
        />
      ) : (
        <SmartTalkAuth />
      )}

      <ClearChatConfirmPopup
        isVisible={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClearChat}
      />
    </div>
  );
};
