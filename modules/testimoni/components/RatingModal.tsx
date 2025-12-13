"use client";

import { useState } from "react";
import { AiOutlineStar, AiFillStar } from "react-icons/ai";
import { useTranslations } from "next-intl";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, message: string) => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
}: RatingModalProps) {
  const t = useTranslations("TestimoniPage");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && message.trim()) {
      onSubmit(rating, message);
      setRating(0);
      setMessage("");
    }
  };

  const handleClose = () => {
    setRating(0);
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-800">
        <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("modal_title")}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t("rating_label")}
            </label>
            <div className="mt-1 flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-2xl text-yellow-400"
                >
                  {star <= (hoverRating || rating) ? (
                    <AiFillStar />
                  ) : (
                    <AiOutlineStar />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t("message_label")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
              rows={4}
              placeholder={t("message_placeholder")}
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={rating === 0 || !message.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
