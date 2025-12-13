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
    <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Rating Button */}
          <div className="relative">
            <button
              ref={ratingButtonRef}
              type="button"
              onClick={() => setShowRatingDropup(!showRatingDropup)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
            >
              {rating > 0 ? (
                <BsStarFill size={18} />
              ) : (
                <BsStar size={18} />
              )}
            </button>

            {/* Rating Dropup */}
            <AnimatePresence>
              {showRatingDropup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-12 left-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 px-1 min-w-[200px]"
                >
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingSelect(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <BsStarFill
                              key={s}
                              size={14}
                              className={
                                s <= (hoverRating || star)
                                  ? "text-yellow-400"
                                  : "text-neutral-300 dark:text-neutral-600"
                              }
                            />
                          ))}
                        </div>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {star}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {star === 1 && "Poor"}
                          {star === 2 && "Fair"}
                          {star === 3 && "Good"}
                          {star === 4 && "Very Good"}
                          {star === 5 && "Excellent"}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-3 pr-12 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[50px] max-h-[120px]"
              rows={1}
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={rating === 0 || !message.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <BsSend size={16} />
            </button>
          </div>
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

