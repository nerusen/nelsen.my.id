"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { BsStar, BsStarFill, BsReply, BsPencil, BsTrash, BsPin } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

import { Testimonial } from "@/common/types/testimoni";
import Tooltip from "@/common/components/elements/Tooltip";

interface TestimonialBubbleProps {
  testimonial: Testimonial;
  onReply?: (testimonialId: string, reply: string) => void;
  onEditReply?: (testimonialId: string, reply: string) => void;
  onDelete?: (testimonialId: string) => void;
  onPin?: (testimonialId: string) => void;
  isAuthor?: boolean;
}

const TestimonialBubble = ({
  testimonial,
  onReply,
  onEditReply,
  onDelete,
  onPin,
  isAuthor = false,
}: TestimonialBubbleProps) => {
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [replyText, setReplyText] = useState(testimonial.reply || "");
  const [showActions, setShowActions] = useState(false);
  const [isBubbleTogglesVisible, setIsBubbleTogglesVisible] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { data: session } = useSession();
  const t = useTranslations("Testimonials");
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isOwnTestimonial = session?.user?.email === testimonial.userId;
  const canEditOwn = isOwnTestimonial && !isAuthor;
  const canAuthorActions = isAuthor;

  const handleReply = () => {
    if (replyText.trim()) {
      onReply?.(testimonial.id, replyText);
      setIsEditingReply(false);
      setShowReplyForm(false);
      setReplyText("");
    }
  };

  const handleEditReply = () => {
    if (replyText.trim()) {
      onEditReply?.(testimonial.id, replyText);
      setIsEditingReply(false);
      setShowReplyForm(false);
    }
  };

  const handleReplyButtonClick = () => {
    if (!testimonial.reply) {
      setShowReplyForm(true);
      setIsBubbleTogglesVisible(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className="text-yellow-400">
        {i < rating ? <BsStarFill size={16} /> : <BsStar size={16} />}
      </span>
    ));
  };


  const handleBubbleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements
    if (e.target instanceof HTMLButtonElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as Element).closest('.bubble-actions') ||
        (e.target as Element).closest('.reply-form')) {
      return;
    }
    
    if (canAuthorActions) {
      setIsBubbleTogglesVisible(!isBubbleTogglesVisible);
    }
  };

  // Handle click outside to close forms
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (bubbleRef.current && !bubbleRef.current.contains(target)) {
        setIsBubbleTogglesVisible(false);
        setShowReplyForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={bubbleRef}
      className={clsx(
        "w-full mb-4",
        testimonial.isPinned && "bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400"
      )}
    >
      {/* Chat-like layout - full width */}
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={testimonial.userImage || "/images/avatar-placeholder.png"}
            alt={testimonial.username}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>

        {/* Bubble Content */}
        <div className="flex-1">
          {/* Main Bubble - Clickable for author */}
          <div 
            className={clsx(
              "bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm",
              "border border-neutral-200 dark:border-neutral-700",
              canAuthorActions && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors"
            )}
            onClick={handleBubbleClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  {testimonial.username}
                </span>
                {testimonial.isPinned && (
                  <BsPin className="text-yellow-500" size={14} />
                )}
              </div>
              <div className="flex items-center gap-1">
                {renderStars(testimonial.rating)}
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
              {testimonial.message}
            </p>

            {/* Date below message */}
            <div className="flex justify-end">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {(() => {
                  try {
                    const dateString = testimonial.createdAt;
                    if (!dateString || dateString === "Invalid Date") {
                      return "Recently";
                    }
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) {
                      return "Recently";
                    }
                    return formatDistanceToNow(date, { addSuffix: true });
                  } catch {
                    return "Recently";
                  }
                })()}
              </span>
            </div>

            {/* Author Reply */}
            {testimonial.reply && (
              <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {t("author_reply")}
                  </span>
                  {canAuthorActions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingReply(!isEditingReply);
                        setShowActions(false);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <BsPencil size={12} />
                    </button>
                  )}
                </div>
                {isEditingReply && canAuthorActions ? (
                  <div className="reply-form space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-2 text-sm border rounded-md resize-none dark:bg-neutral-700 dark:border-neutral-600"
                      rows={3}
                      placeholder={t("reply_placeholder")}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditReply();
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {t("save_reply")}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingReply(false);
                          setReplyText(testimonial.reply || "");
                        }}
                        className="px-3 py-1 text-xs bg-neutral-600 text-white rounded-md hover:bg-neutral-700"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                    {testimonial.reply}
                  </p>
                )}
              </div>
            )}

            {/* Reply Form - Toggle based on showReplyForm state */}
            {showReplyForm && canAuthorActions && !testimonial.reply && (
              <div className="reply-form border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2 text-sm border rounded-md resize-none dark:bg-neutral-700 dark:border-neutral-600"
                    rows={3}
                    placeholder={t("reply_placeholder")}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReply();
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {t("reply")}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReplyForm(false);
                        setReplyText("");
                      }}
                      className="px-3 py-1 text-xs bg-neutral-600 text-white rounded-md hover:bg-neutral-700"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Toggle style like chat room */}
          {canAuthorActions && (
            <div className="mt-2 flex justify-start">
              <AnimatePresence>
                {isBubbleTogglesVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="bubble-actions bg-[#212121] rounded-full px-1 sm:px-2 py-1 flex items-center gap-1 shadow-lg z-5 min-w-max">

                      {/* Reply Button */}
                      <Tooltip title="Reply">
                        <motion.button
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.1, delay: 0 }}
                          onClick={handleReplyButtonClick}
                          className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                        >
                          <BsReply size={14} />
                        </motion.button>
                      </Tooltip>

                      {/* Edit Reply Button - only if reply exists */}
                      {testimonial.reply && (
                        <Tooltip title="Edit Reply">
                          <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.1, delay: 0.05 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditingReply(true);
                              setIsBubbleTogglesVisible(false);
                            }}
                            className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                          >
                            <BsPencil size={14} />
                          </motion.button>
                        </Tooltip>
                      )}

                      {/* Pin/Unpin Button */}
                      <Tooltip title={testimonial.isPinned ? "Unpin" : "Pin"}>
                        <motion.button
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.1, delay: 0.1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPin?.(testimonial.id);
                            setIsBubbleTogglesVisible(false);
                          }}
                          className={clsx(
                            "bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center",
                            testimonial.isPinned && "bg-yellow-600 hover:bg-yellow-500"
                          )}
                        >
                          <BsPin size={14} />
                        </motion.button>
                      </Tooltip>

                      {/* Delete Button */}
                      <Tooltip title="Delete">
                        <motion.button
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.1, delay: 0.15 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(testimonial.id);
                            setIsBubbleTogglesVisible(false);
                          }}
                          className="bg-[#121212] rounded-full p-1.5 sm:p-2 text-white hover:bg-[#1a1a1a] transition duration-100 active:scale-90 flex items-center justify-center"
                        >
                          <BsTrash size={14} />
                        </motion.button>
                      </Tooltip>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialBubble;

