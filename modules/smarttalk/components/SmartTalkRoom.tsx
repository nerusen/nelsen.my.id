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
    if (data && messages.length === 0) {
      // Only set messages from server data if we don't have any local messages yet
      // This prevents overwriting optimistic updates
      setMessages(data);
    }
  }, [data, messages.length]);

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Smart Talk fetch error:", error);
    }
    console.log("Smart Talk data:", data);
    console.log("Smart Talk loading:", isLoading);
  }, [data, error, isLoading]);

  // Simplified and reliable real-time subscription
  useEffect(() => {
    if (!session?.user?.email) return;

    console.log("🔄 Setting up real-time subscription for user:", session?.user?.email);

    let channel: any = null;
    let pollInterval: NodeJS.Timeout | null = null;

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

            // If this is AI message and we have thinking message, replace it
            if (newMessage.is_ai && thinkingMessageId) {
              console.log("🔄 Replacing thinking message with AI response");
              setMessages((prev: MessageProps[]) => prev.map((msg: MessageProps) =>
                msg.id === thinkingMessageId
                  ? { ...newMessage, is_thinking: false }
                  : msg
              ));
              setThinkingMessageId(null);
              console.log("✅ AI response displayed via real-time");
              return;
            }

            // Add non-AI messages normally
            if (!newMessage.is_ai) {
              setMessages((prev: MessageProps[]) => [...prev, newMessage]);
            }
          }
        )
        .subscribe((status: string, err: any) => {
          console.log("🔗 Subscription status:", status, err);

          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time');
            // Stop polling when real-time works
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error('❌ Subscription failed, starting polling fallback');
            // Start polling as fallback
            if (!pollInterval) {
              pollInterval = setInterval(async () => {
                if (thinkingMessageId) {
                  try {
                    console.log('🔍 Polling for AI response...');
                    const response = await fetch(`/api/smart-talk?email=${session?.user?.email}&t=${Date.now()}`);
                    const data = await response.json();

                    // Find AI messages that are newer than our current messages
                    const currentMaxTime = Math.max(
                      ...messages.map(msg => new Date(msg.created_at).getTime()),
                      0
                    );

                    const newAIMessages = data
                      .filter((msg: MessageProps) =>
                        msg.is_ai &&
                        new Date(msg.created_at).getTime() > currentMaxTime &&
                        !messages.some(existing => existing.id === msg.id)
                      )
                      .sort((a: MessageProps, b: MessageProps) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      );

                    if (newAIMessages.length > 0) {
                      const latestAIMessage = newAIMessages[0];
                      console.log('🎯 Found new AI response via polling, replacing thinking message');
                      setMessages((prev: MessageProps[]) => prev.map((msg: MessageProps) =>
                        msg.id === thinkingMessageId
                          ? { ...latestAIMessage, is_thinking: false }
                          : msg
                      ));
                      setThinkingMessageId(null);
                      console.log('✅ AI response displayed via polling');
                    }
                  } catch (error) {
                    console.error('❌ Polling error:', error);
                  }
                }
              }, 2000); // Poll every 2 seconds
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
      if (pollInterval) {
        clearInterval(pollInterval);
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
