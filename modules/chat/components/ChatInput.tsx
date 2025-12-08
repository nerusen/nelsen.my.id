import clsx from "clsx";
import { ChangeEvent, FormEvent, useRef, useState, useEffect } from "react";
import { FiSend as SendIcon } from "react-icons/fi";
import { MdPhotoLibrary as PhotoIcon } from "react-icons/md";
import { IoClose as CloseIcon } from "react-icons/io5";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { ChatInputProps } from "@/common/types/chat";

interface ChatInputPropsNew extends ChatInputProps {
  replyName?: string;
  isWidget?: boolean;
  onCancelReply: () => void;
  onSendMessage: (message: string, media?: string[]) => void;
}

const ChatInput = ({
  replyName,
  isWidget,
  onSendMessage,
  onCancelReply,
}: ChatInputPropsNew) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [media, setMedia] = useState<string[]>([]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = useTranslations("ChatRoomPage");

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();

    if (isSending) return;

    setIsSending(true);

    try {
      onSendMessage(message, media);
      setMessage("");
      setMedia([]);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = 2;
    const selectedFiles = Array.from(files).slice(0, maxFiles - media.length);

    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setMedia((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset file input
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Insert newline
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      textarea.value = value.substring(0, start) + '\n' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      setMessage(textarea.value);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <>
      <form className="flex flex-col gap-2 px-4 border-t border-neutral-300 py-4 dark:border-neutral-700">
        {replyName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-fit items-center gap-2 rounded-md bg-neutral-200 px-2 py-1 text-xs dark:bg-neutral-800"
          >
            <span>Replying to {replyName}</span>
            <CloseIcon
              size={14}
              onClick={() => onCancelReply()}
              className="cursor-pointer"
            />
          </motion.div>
        )}
        {media.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {media.map((mediaItem, index) => (
              <div key={index} className="relative">
                <Image
                  src={mediaItem}
                  alt={`Preview ${index + 1}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover aspect-square"
                />
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-red-500 bg-opacity-80 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={handleChange}
            placeholder={t("placeholder")}
            disabled={isSending}
            ref={inputRef}
            autoFocus
            className="flex-grow rounded-md border p-2 focus:outline-none dark:border-[#3A3A3A] dark:bg-[#1F1F1F]"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 rounded-md p-3 bg-white dark:bg-[#1F1F1F] border border-neutral-300 dark:border-[#3A3A3A] text-black dark:text-white transition duration-100 active:scale-90"
            disabled={isSending || media.length >= 2}
          >
            <PhotoIcon size={18} />
          </button>
          <button
            type="submit"
            onClick={handleSendMessage}
            className={clsx(
              "ml-2 rounded-md p-3 text-black dark:text-white transition duration-100 active:scale-90",
              (message.trim() || media.length > 0)
                ? "bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                : "cursor-not-allowed bg-white border border-neutral-300 dark:bg-[#1F1F1F] dark:border-[#3A3A3A] active:scale-100",
            )}
            disabled={isSending || (!message.trim() && media.length === 0)}
            data-umami-event="click_send_message"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </form>
    </>
  );
};

export default ChatInput;
