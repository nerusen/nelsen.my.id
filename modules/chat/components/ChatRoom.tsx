"use client";

import useSWR from "swr";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import ChatAuth from "./ChatAuth";
import ChatInput from "./ChatInput";
import ChatList from "./ChatList";
import ChatItemSkeleton from "./ChatItemSkeleton";
import WelcomeNotification from "./WelcomeNotification";

import { MessageProps } from "@/common/types/chat";
import { fetcher } from "@/services/fetcher";
import { createClient } from "@/common/utils/client";
import useNotif from "@/hooks/useNotif";

export const ChatRoom = ({ isWidget = false }: { isWidget?: boolean }) => {
  const { data, isLoading, error } = useSWR("/api/chat", fetcher);

  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isReply, setIsReply] = useState({ is_reply: false, name: "" });
  const [showPopupFor, setShowPopupFor] = useState<string | null>(null);

  const { data: session } = useSession();

  const supabase = createClient();

  const notif = useNotif();

  const handleClickReply = (name: string) => {
    if (!session?.user) return notif("Please sign in to reply");
    setIsReply({ is_reply: true, name });
  };

  const handleCancelReply = () => {
    setIsReply({ is_reply: false, name: "" });
  };

  const handleSendMessage = async (message: string, media?: string[]) => {
    const messageId = uuidv4();
    const newMessageData = {
      id: messageId,
      name: session?.user?.name,
      email: session?.user?.email,
      image: session?.user?.image,
      message,
      media,
      is_reply: isReply.is_reply,
      reply_to: isReply.name,
      is_show: true,
      created_at: new Date().toISOString(),
    };
    try {
      await axios.post("/api/chat", newMessageData);
      // Immediately add the message with media to local state for real-time display
      setMessages((prevMessages) => [...prevMessages, newMessageData]);
      notif("Successfully to send message");

      // Check if this is the user's first message
      const userMessages = messages.filter(msg => msg.email === session?.user?.email);
      if (userMessages.length === 0) {
        setShowPopupFor(messageId);
      }

      // Clear reply state after sending
      setIsReply({ is_reply: false, name: "" });
    } catch (error) {
      console.error("Error:", error);
      notif("Failed to send message");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await axios.delete(`/api/chat/${id}`, { data: { email: session?.user?.email } });
      notif("Successfully to delete message");
    } catch (error) {
      notif("Failed to delete message");
    }
  };

  const handlePinMessage = async (id: string, is_pinned: boolean) => {
    try {
      await axios.patch("/api/chat", { id, is_pinned, email: session?.user?.email });
      notif(`Message ${is_pinned ? "pinned" : "unpinned"} successfully`);
    } catch (error) {
      notif("Failed to toggle pin status");
    }
  };

  const handleEditMessage = async (id: string, message: string) => {
    try {
      await axios.put(`/api/chat/${id}`, { message, email: session?.user?.email });
      notif("Message edited successfully");
    } catch (error) {
      notif("Failed to edit message");
    }
  };

  useEffect(() => {
    if (data) setMessages(data);
  }, [data]);

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Chat fetch error:", error);
    }
    console.log("Chat data:", data);
    console.log("Chat loading:", isLoading);
  }, [data, error, isLoading]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            payload.new as MessageProps,
          ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.id !== payload.old.id),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === payload.new.id ? (payload.new as MessageProps) : msg,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <>
      <WelcomeNotification isWidget={isWidget} />
      {isLoading ? (
        <ChatItemSkeleton />
      ) : (
        <ChatList
          messages={messages}
          onDeleteMessage={handleDeleteMessage}
          onClickReply={handleClickReply}
          onPinMessage={handlePinMessage}
          onEditMessage={handleEditMessage}
          isWidget={isWidget}
          showPopupFor={showPopupFor}
        />
      )}
      {session ? (
        <ChatInput
          onSendMessage={handleSendMessage}
          onCancelReply={handleCancelReply}
          replyName={isReply.name}
          isWidget={isWidget}
        />
      ) : (
        <ChatAuth isWidget={isWidget} />
      )}
    </>
  );
};
