"use client";

import { useState, useRef, useEffect } from "react";
import { BsStarFill, BsSend, BsStar } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

interface TestimonialInputProps {
  onSubmit: (rating: number, message: string) => void;
  placeholder?: string;
}

export default function TestimonialInput({
  onSubmit,
  placeholder = "Write your testimonial..."
}: TestimonialInputProps) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [showRatingDropup, setShowRatingDropup] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && message.trim()) {
      onSubmit(rating, message);
      setMessage("");
      setRating(0);
      setShowRatingDropup(false);
    }
  };

  const handleRatingSelect = (selectedRating: number) => {
    setRating(selectedRating);
    setShowRatingDropup(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      ratingButtonRef.current &&
      !ratingButtonRef.current.contains(event.target as Node)
    ) {
      setShowRatingDropup(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-neutral-300 py-4 dark:border-neutral-700 px-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Rating Button */}
          <div className="relative flex-shrink-0">
            <button
              ref={ratingButtonRef}
              type="button"
              onClick={() => setShowRatingDropup(!showRatingDropup)}
              className="flex items-center justify-center px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-200 hover:bg-neutral-700 transition-colors w-[100px]"
            >
              <BsStarFill size={16} className={rating > 0 ? "text-yellow-400" : "text-neutral-400"} />
              <span className="ml-1 text-sm">Rating</span>
            </button>

            {/* Rating Dropup */}
            <AnimatePresence>
              {showRatingDropup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-12 left-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 px-3 min-w-[120px]"
                >
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingSelect(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                      >
                        <BsStarFill
                          size={16}
                          className={
                            star <= (hoverRating || star)
                              ? "text-yellow-400"
                              : "text-neutral-300 dark:text-neutral-600"
                          }
                        />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {star}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[50px] max-h-[120px]"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={rating === 0 || !message.trim()}
            className={`rounded-md p-3 text-white transition duration-100 active:scale-90 ${
              rating > 0 && message.trim()
                ? "bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                : "cursor-not-allowed bg-neutral-800 border border-neutral-600 active:scale-100"
            }`}
          >
            <BsSend size={18} />
          </button>
        </div>

        {/* Rating Display */}
        {rating > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-2 px-2"
          >
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Rating: {rating}/5
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <BsStarFill
                  key={star}
                  size={14}
                  className={
                    star <= rating
                      ? "text-yellow-400"
                      : "text-neutral-300 dark:text-neutral-600"
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}

