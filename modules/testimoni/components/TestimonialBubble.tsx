"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { BsStar, BsStarFill, BsReply, BsPencil, BsTrash, BsPin, BsThreeDotsVertical } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

import { Testimonial } from "@/common/types/testimoni";

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
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { data: session } = useSession();
  const t = useTranslations("Testimonials");

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className="text-yellow-400">
        {i < rating ? <BsStarFill size={16} /> : <BsStar size={16} />}
      </span>
    ));
  };

  const handleBubbleClick = () => {
    if (canAuthorActions) {
      setShowReplyForm(!showReplyForm);
      setShowActions(false);
    }
  };

  return (
    <div className={clsx(
      "flex gap-3 mb-4",
      testimonial.isPinned && "bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400"
    )}>
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(testimonial.rating)}
              </div>
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
          </div>

          {/* Message */}
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
            {testimonial.message}
          </p>

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
                <div className="space-y-2">
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
            <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 mt-3">
              <div className="space-y-2">
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
          <div className="flex items-center gap-2 mt-2 ml-4">
            {/* Three dots menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <BsThreeDotsVertical size={16} className="text-neutral-500 dark:text-neutral-400" />
              </button>
              
              {/* Dropdown menu */}
              {showActions && (
                <div className="absolute top-8 left-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPin?.(testimonial.id);
                      setShowActions(false);
                    }}
                    className={clsx(
                      "w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700",
                      testimonial.isPinned
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-neutral-700 dark:text-neutral-300"
                    )}
                  >
                    <BsPin size={12} />
                    {testimonial.isPinned ? t("unpin") : t("pin")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(testimonial.id);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <BsTrash size={12} />
                    {t("delete")}
                  </button>
                </div>
              )}
            </div>
            
            {canEditOwn && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("your_testimonial")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialBubble;
