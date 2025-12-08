import Image from "next/image";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { MdCode as AdminIcon } from "react-icons/md";
import { MdVerified as VerifiedIcon } from "react-icons/md";
import { FiTrash2 as DeleteIcon } from "react-icons/fi";
import { BsFillReplyAllFill as ReplyIcon } from "react-icons/bs";
import { BsPinAngleFill as PinIcon } from "react-icons/bs";
import { MdEdit as EditIcon } from "react-icons/md";
import { IoInformationCircle as InfoIcon } from "react-icons/io5";
import { IoClose as CloseIcon } from "react-icons/io5";
import { FiMusic as MusicIcon } from "react-icons/fi";
import { FiFileText as FileIcon } from "react-icons/fi";
import { FiDownload as DownloadIcon } from "react-icons/fi";
import { FiPlay as PlayIcon } from "react-icons/fi";
import { FiPause as PauseIcon } from "react-icons/fi";

import ChatTime from "./ChatTime";
import MessageRenderer from "./MessageRenderer";
import ImageModal from "./ImageModal";

import Tooltip from "@/common/components/elements/Tooltip";
import { MessageProps } from "@/common/types/chat";

type Attachment = {
  type: 'image' | 'audio' | 'document';
  data: string;
  name: string;
};

interface ChatItemProps extends MessageProps {
  isWidget?: boolean;
  onDelete: (id: string) => void;
  onReply: (name: string) => void;
  onPin: (id: string, is_pinned: boolean) => void;
  onEdit: (id: string, message: string) => void;
  onEditCancel?: () => void;
  isEditing?: boolean;
  showPopup?: boolean;
  isTogglesVisible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
}

const ChatItem = ({
  id,
  name,
  email,
  image,
  message,
  attachments,
  created_at,
  reply_to,
  is_reply,
  is_pinned,
  isWidget,
  onDelete,
  onReply,
  onPin,
  onEdit,
  onEditCancel,
  isEditing,
  showPopup,
  isTogglesVisible: externalIsTogglesVisible,
  onToggleVisibility,
}: ChatItemProps) => {
  const [isHover, setIsHover] = useState(false);
  const [internalIsTogglesVisible, setInternalIsTogglesVisible] = useState(false);
  const [editMessage, setEditMessage] = useState(message);
  const [isPopupVisible, setIsPopupVisible] = useState(showPopup || false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDuration, setAudioDuration] = useState<{ [key: string]: number }>({});

  const [isBubbleTogglesVisible, setIsBubbleTogglesVisible] = useState(false);

  const isTogglesVisible = externalIsTogglesVisible !== undefined ? externalIsTogglesVisible : internalIsTogglesVisible;

  // Reset editMessage when message changes or when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditMessage(message);
    }
  }, [message, isEditing]);

  // Handle popup visibility based on showPopup prop
  useEffect(() => {
    if (showPopup) {
      setIsPopupVisible(true);
    }
  }, [showPopup]);

  // Close bubble toggles when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isBubbleTogglesVisible && !target.closest('.bubble-container')) {
        setIsBubbleTogglesVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBubbleTogglesVisible]);
  const { data: session } = useSession();

  const authorEmail = process.env.NEXT_PUBLIC_AUTHOR_EMAIL;
  const isAuthor = email === authorEmail;
  const isOwnMessage = session?.user?.email === email;
  const isCurrentUserAuthor = session?.user?.email === authorEmail;

  const condition = isAuthor && !isWidget;

  const handleEditSave = () => {
    if (editMessage.trim()) {
      onEdit(id, editMessage);
      onEditCancel?.();
      setIsHover(false); // Reset hover state after edit
    }
  };

  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const handleDownload = (fileData: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAudioPlay = (attachmentId: string, audioSrc: string) => {
    const audio = new Audio(audioSrc);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(prev => ({ ...prev, [attachmentId]: audio.duration }));
    });
    audio.addEventListener('timeupdate', () => {
      setAudioProgress(prev => ({ ...prev, [attachmentId]: audio.currentTime }));
    });
    audio.addEventListener('ended', () => {
      setPlayingAudio(null);
      setAudioProgress(prev => ({ ...prev, [attachmentId]: 0 }));
    });
    audio.play();
    setPlayingAudio(attachmentId);
  };

  const handleAudioPause = (attachmentId: string) => {
    setPlayingAudio(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
    return truncatedName + '.' + extension;
  };

  const handleEditCancel = () => {
    setEditMessage(message);
    onEditCancel?.();
    setIsHover(false); // Reset hover state after cancel
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 lg:px-8",
        condition && "flex-row-reverse",
      )}
    >
      {isPopupVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-2 left-2 z-10 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-sm bg-neutral-100/90 dark:bg-neutral-800/90 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200"
        >
          <div className="flex items-center gap-2">
            <InfoIcon size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-xs">You can delete and edit your messages.</span>
            <button
              onClick={() => setIsPopupVisible(false)}
              className="ml-auto p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
              aria-label="Close popup"
            >
              <CloseIcon size={12} />
            </button>
          </div>
        </motion.div>
      )}
      {image && (
        <div className={condition ? "chat-author-profile-border flex-shrink-0" : ""}>
          <Image
            src={image}
            width={40}
            height={40}
            alt={name}
            className="relative z-10 rounded-full border dark:border-neutral-800"
          />
        </div>
      )}

      <div
        className={clsx("space-y-1", condition && "flex flex-col items-end")}
      >
        <div
          className={clsx(
            "flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1",
            condition && "md:flex-row-reverse",
          )}
        >

          <div className="hidden md:flex">
            <ChatTime datetime={created_at} />
          </div>
        </div>
        <div
          className={clsx(
            "group flex flex-col w-fit relative bubble-container",
            condition && "items-end",
          )}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          onClick={(e) => {
            e.stopPropagation();
            setIsBubbleTogglesVisible(!isBubbleTogglesVisible);
          }}
        >
          <motion.div
            className={clsx(
              "rounded-xl px-4 relative overflow-visible max-w-xs border",
              condition
                ? "bg-[#15192F] dark:text-neutral-50 border-[#329BFF]/20 author-bubble-glow"
                : "bg-neutral-200 dark:bg-[#1E1E1E] dark:text-neutral-50 border-neutral-300 dark:border-neutral-600",
              isEditing && "blur-none",
            )}
            animate={{
              paddingTop: "0.5rem",
              paddingBottom: isBubbleTogglesVisible ? "1rem" : "0.5rem",
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 text-sm opacity-50"
                  placeholder="Edit your message..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEditSave();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      handleEditCancel();
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleEditCancel}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-500 transition duration-100 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-400 transition duration-100 active:scale-95"
                    disabled={!editMessage.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-x-2 mb-2">
                  <div className="text-sm dark:text-xs font-bold dark:text-neutral-200">{name}</div>
                  {condition && (
                    <>
                      <motion.button
                        className="flex items-center gap-[2px] rounded-full bg-teal-500/20 px-1.5 py-0.5 font-medium text-teal-300 hover:bg-teal-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <AdminIcon size={13} />
                      </motion.button>
                      <motion.button
                        className="flex items-center gap-[2px] rounded-full bg-blue-500/20 px-1.5 py-0.5 font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <VerifiedIcon size={13} />
                      </motion.button>

                    </>
                  )}
                </div>
                {is_reply && (
                  <>
                    <div className={clsx("text-xs text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded-md mb-1 -mx-3", condition ? "bg-[#1A3273]" : "bg-neutral-300 dark:bg-[#121212]")}>
                      membalas <span className="text-blue-500">@{reply_to}</span>
                    </div>
                    <div className="mt-1">
                      <MessageRenderer message={message} />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {is_pinned && <span className="text-xs text-neutral-500 font-medium inline-flex items-center gap-1"><PinIcon size={12} className="text-neutral-500" /> Pinned</span>}
                      <ChatTime datetime={created_at} />
                    </div>
                  </>
                )}
                {!is_reply && (
                  <>
                    {attachments && attachments.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {attachments.map((attachment) => {
                          if (attachment.attachment_type === 'image') {
                            return (
                              <Image
                                key={attachment.id}
                                src={attachment.file_data}
                                alt={attachment.file_name}
                                width={200}
                                height={200}
                                className="rounded-lg cursor-pointer object-cover max-w-full h-auto"
                                onClick={() => handleImageClick(attachment.file_data)}
                              />
                            );
                          } else if (attachment.attachment_type === 'audio') {
                            const isPlaying = playingAudio === attachment.id;
                            const progress = audioProgress[attachment.id] || 0;
                            const duration = audioDuration[attachment.id] || attachment.duration_seconds || 0;
                            const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

                            return (
                              <div key={attachment.id} className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg max-w-xs">
                                <button
                                  onClick={() => isPlaying ? handleAudioPause(attachment.id) : handleAudioPlay(attachment.id, attachment.file_data)}
                                  className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-full transition-colors"
                                >
                                  {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium mb-1 truncate" title={attachment.file_name}>{truncateFileName(attachment.file_name, 15)}</div>
                                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 mb-1">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${progressPercent}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                    {formatDuration(progress)} / {formatDuration(duration)}
                                  </div>
                                </div>
                              </div>
                            );
                          } else if (attachment.attachment_type === 'document') {
                            return (
                              <div key={attachment.id} className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg max-w-xs">
                                <FileIcon size={20} className="flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate" title={attachment.file_name}>{truncateFileName(attachment.file_name, 18)}</div>
                                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                    {(attachment.file_size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownload(attachment.file_data, attachment.file_name)}
                                  className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-colors"
                                >
                                  <DownloadIcon size={14} />
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                    <MessageRenderer message={message} />
                    <div className="flex justify-between items-center mt-1">
                      {is_pinned && <span className="text-xs text-neutral-500 font-medium inline-flex items-center gap-1"><PinIcon size={12} className="text-neutral-500" /> Pinned</span>}
                      <ChatTime datetime={created_at} />
                    </div>
                  </>
                )}
              </>
            )}

          </motion.div>

          <AnimatePresence>
            {isBubbleTogglesVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-2 flex justify-start"
              >
                <div className="bg-[#212121] rounded-full px-1 sm:px-2 py-1 flex items-center gap-1 shadow-lg z-5 min-w-max">
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.1, delay: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply(name);
                      setIsBubbleTogglesVisible(false);
                    }}
                    className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                  >
                    <Tooltip title="Reply">
                      <ReplyIcon
                        size={14}
                        className={clsx(
                          "transition duration-300",
                          condition && "scale-x-[-1]",
                        )}
                      />
                    </Tooltip>
                  </motion.button>

                  {(isOwnMessage || isCurrentUserAuthor) && !isEditing && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.1, delay: 0.05 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(id, message);
                        setIsBubbleTogglesVisible(false);
                      }}
                      className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                    >
                      <Tooltip title="Edit Message">
                        <EditIcon size={14} />
                      </Tooltip>
                    </motion.button>
                  )}

                  {isCurrentUserAuthor && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.1, delay: 0.1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin(id, !is_pinned);
                        setIsBubbleTogglesVisible(false);
                      }}
                      className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                    >
                      <Tooltip title={is_pinned ? "Unpin Message" : "Pin Message"}>
                        <PinIcon size={14} />
                      </Tooltip>
                    </motion.button>
                  )}

                  {(isOwnMessage || isCurrentUserAuthor) && !isEditing && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.1, delay: 0.15 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                        setIsBubbleTogglesVisible(false);
                      }}
                      className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                    >
                      <Tooltip title="Delete Message">
                        <DeleteIcon size={14} />
                    </Tooltip>
                  </motion.button>
                )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageSrc={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={(imageSrc) => handleDownload(imageSrc, 'image.jpg')}
        />
      )}
    </div>
  );
};

export default ChatItem;
