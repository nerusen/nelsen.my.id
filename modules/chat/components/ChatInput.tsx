import clsx from "clsx";
import { ChangeEvent, FormEvent, useRef, useState, useEffect } from "react";
import { FiSend as SendIcon, FiLink as LinkIcon } from "react-icons/fi";
import { MdPhotoLibrary as PhotoIcon } from "react-icons/md";
import { IoClose as CloseIcon } from "react-icons/io5";
import { FiFileText as FileIcon } from "react-icons/fi";
import { FiMusic as MusicIcon } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { ChatInputProps } from "@/common/types/chat";
import { createClient } from "@/common/utils/client";

type Attachment = {
  type: 'image' | 'audio' | 'document';
  data: string;
  name: string;
  storagePath?: string;
  publicUrl?: string;
};

interface ChatInputPropsNew extends ChatInputProps {
  replyName?: string;
  isWidget?: boolean;
  onCancelReply: () => void;
  onSendMessage: (message: string, media?: Attachment | null) => void;
}

const ChatInput = ({
  replyName,
  isWidget,
  onSendMessage,
  onCancelReply,
}: ChatInputPropsNew) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = useTranslations("ChatRoomPage");

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();

    if (isSending) return;

    setIsSending(true);

    try {
      onSendMessage(message, attachment);
      setMessage("");
      setAttachment(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only one file

    let type: 'image' | 'audio' | 'document';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
    } else if (
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain'
    ) {
      type = 'document';
    } else {
      alert('Unsupported file type. Please select an image, audio, or document file.');
      return;
    }

    // Start upload
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Check if user is logged in via NextAuth
      if (!session?.user?.email) {
        alert('You must be logged in to upload files');
        setIsUploading(false);
        return;
      }

      const supabase = createClient();

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `${session.user.email}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload file. Please try again.');
        setIsUploading(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(storagePath);

      setUploadProgress(100);

      // Set attachment with storage info
      setTimeout(() => {
        setAttachment({
          type,
          data: publicUrlData.publicUrl, // Use public URL instead of base64
          name: file.name,
          storagePath,
          publicUrl: publicUrlData.publicUrl
        });
        setIsUploading(false);
        setUploadProgress(0);
      }, 200);

    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
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
        {(attachment || isUploading) && (
          <div className="flex gap-2">
            <div className="relative flex items-center gap-2 bg-neutral-200 dark:bg-neutral-800 px-3 py-2 rounded-lg min-w-[200px]">
              {isUploading ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Uploading...</div>
                      <div className="w-full bg-neutral-300 dark:bg-neutral-600 rounded-full h-2 mb-1">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {uploadProgress.toFixed(0)}% • Calculating size...
                      </div>
                    </div>
                  </div>
                </>
              ) : attachment ? (
                <>
                  {attachment.type === 'image' ? (
                    <Image
                      src={attachment.data}
                      alt="Attachment preview"
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  ) : attachment.type === 'audio' ? (
                    <MusicIcon size={24} />
                  ) : (
                    <FileIcon size={24} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{attachment.name}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {(attachment.data.length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="bg-red-500 bg-opacity-80 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <CloseIcon size={12} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
        <div className="flex">
          <textarea
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            disabled={isSending}
            ref={inputRef}
            autoFocus
            rows={1}
            className="flex-grow rounded-md border p-2 focus:outline-none dark:border-[#3A3A3A] dark:bg-[#1F1F1F] resize-none max-h-32 overflow-y-auto"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 rounded-md p-3 bg-white dark:bg-[#1F1F1F] border border-neutral-300 dark:border-[#3A3A3A] text-black dark:text-white transition duration-100 active:scale-90"
            disabled={isSending || attachment !== null}
          >
            <LinkIcon size={18} />
          </button>
          <button
            type="submit"
            onClick={handleSendMessage}
            className={clsx(
              "ml-2 rounded-md p-3 text-black dark:text-white transition duration-100 active:scale-90",
              (message.trim() || attachment !== null)
                ? "bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                : "cursor-not-allowed bg-white border border-neutral-300 dark:bg-[#1F1F1F] dark:border-[#3A3A3A] active:scale-100",
            )}
            disabled={isSending || (!message.trim() && attachment === null)}
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
