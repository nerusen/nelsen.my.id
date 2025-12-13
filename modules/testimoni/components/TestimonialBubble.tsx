"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { BsStar, BsStarFill, BsReply, BsPencil, BsTrash, BsPin } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

import { Testimonial } from "@/common/types/testimoni";

interface TestimonialBubbleProps {
  testimonial: Testimonial;
  onReply?: (testimonialId: string, reply: string) => void;
  onEditReply?: (testimonialId: string, reply: string) => void;
  onDelete?: (testimonialId: string) => void;
  onPin?: (testimonialId: string, pinned: boolean) => void;
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
  const { data: session } = useSession();
  const t = useTranslations("Testimonials");

  const isOwnTestimonial = session?.user?.email === testimonial.userId;
  const canEditOwn = isOwnTestimonial && !isAuthor;
  const canAuthorActions = isAuthor;

  const handleReply = () => {
    if (replyText.trim()) {
      onReply?.(testimonial.id, replyText);
      setIsEditingReply(false);
    }
  };

  const handleEditReply = () => {
    if (replyText.trim()) {
      onEditReply?.(testimonial.id, replyText);
      setIsEditingReply(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className="text-yellow-400">
        {i < rating ? <BsStarFill size={16} /> : <BsStar size={16} />}
      </span>
    ));
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
        <div className={clsx(
          "bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm",
          "border border-neutral-200 dark:border-neutral-700"
        )}>
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
                {formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true })}
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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {t("author_reply")}
                </span>
                {canAuthorActions && (
                  <button
                    onClick={() => setIsEditingReply(!isEditingReply)}
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
                      onClick={handleEditReply}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {t("save_reply")}
                    </button>
                    <button
                      onClick={() => {
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

          {/* Reply Input for Author */}
          {canAuthorActions && !testimonial.reply && !isEditingReply && (
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
                    onClick={handleReply}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t("reply")}
                  </button>
                  <button
                    onClick={() => setReplyText("")}
                    className="px-3 py-1 text-xs bg-neutral-600 text-white rounded-md hover:bg-neutral-700"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2 ml-4">
          {canAuthorActions && (
            <>
              <button
                onClick={() => onPin?.(testimonial.id, !testimonial.is_pinned)}
                className={clsx(
                  "text-xs px-2 py-1 rounded-md flex items-center gap-1",
                  testimonial.is_pinned
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400"
                )}
              >
                <BsPin size={12} />
                {testimonial.is_pinned ? t("unpin") : t("pin")}
              </button>
              <button
                onClick={() => onDelete?.(testimonial.id)}
                className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 flex items-center gap-1"
              >
                <BsTrash size={12} />
                {t("delete")}
              </button>
            </>
          )}
          {canEditOwn && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("your_testimonial")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialBubble;
