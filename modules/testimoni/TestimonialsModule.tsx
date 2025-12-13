"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { BsPin, BsList, BsChatDots, BsChevronDown } from "react-icons/bs";

import Container from "@/common/components/elements/Container";
import TestimonialBubble from "./components/TestimonialBubble";
import TestimonialInput from "./components/TestimonialInput";
import TestimonialSkeleton from "./components/TestimonialSkeleton";

import { Testimonial } from "@/common/types/testimoni";

const TestimonialsModule = () => {
  const t = useTranslations("TestimoniPage");
  const { data: session } = useSession();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'list'>('chat');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [lastRatingTime, setLastRatingTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAuthor = session?.user?.email === process.env.NEXT_PUBLIC_AUTHOR_EMAIL;

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000); // Hide after 5 seconds
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    // Auto scroll to bottom on initial load if there are enough messages
    if (testimonials.length > 3) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [testimonials]);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/testimoni");
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTestimonial = async (rating: number, message: string) => {
    // Prevent duplicate ratings within 30 seconds
    const now = Date.now();
    if (lastRatingTime && now - lastRatingTime < 30000) {
      showNotification("You can only submit one rating every 30 seconds.");
      return;
    }

    try {
      const response = await fetch("/api/testimoni", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, message }),
      });

      if (response.ok) {
        setLastRatingTime(now);
        await fetchTestimonials();
        // Scroll to bottom after new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        showNotification("Failed to submit testimonial. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit testimonial:", error);
      showNotification("Failed to submit testimonial. Please try again.");
    }
  };

  const handleReply = async (testimonialId: string, reply: string) => {
    if (!isAuthor) return;

    try {
      const response = await fetch(`/api/testimoni/${testimonialId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reply }),
      });

      if (response.ok) {
        await fetchTestimonials();
      }
    } catch (error) {
      console.error("Failed to reply:", error);
    }
  };

  const handleDelete = async (testimonialId: string) => {
    try {
      const response = await fetch(`/api/testimoni/${testimonialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTestimonials();
      }
    } catch (error) {
      console.error("Failed to delete testimonial:", error);
    }
  };

  const handlePin = async (testimonialId: string) => {
    if (!isAuthor) return;

    try {
      const response = await fetch(`/api/testimoni/${testimonialId}/pin`, {
        method: "PATCH",
      });

      if (response.ok) {
        await fetchTestimonials();
      }
    } catch (error) {
      console.error("Failed to pin testimonial:", error);
    }
  };

  return (
    <Container className="max-w-4xl mx-auto py-6">
      {/* Header Section */}
      <section className="text-center mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          {t("title")}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-4">
          {t("description")}
        </p>
        <hr className="border-neutral-300 dark:border-neutral-700" />
      </section>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-center"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'chat' ? 'list' : 'chat')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'chat'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {viewMode === 'chat' ? <BsChatDots size={16} /> : <BsList size={16} />}
            {viewMode === 'chat' ? 'Chat View' : 'List View'}
          </button>
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showPinnedOnly
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <BsPin size={16} />
            {showPinnedOnly ? 'Show All' : 'Show Pinned'}
          </button>
        </div>
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <BsChevronDown size={16} />
          Scroll to Bottom
        </button>
      </div>

      {/* Chat-like Container */}
      <div className={`bg-neutral-900 rounded-lg border border-neutral-700 ${viewMode === 'chat' ? 'h-[600px]' : 'h-auto'} flex flex-col`}>
        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${viewMode === 'list' ? 'max-h-[800px]' : ''}`}>
          {loading ? (
            // Skeleton Loading
            [...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <TestimonialSkeleton />
              </motion.div>
            ))
          ) : testimonials.length > 0 ? (
            testimonials
              .filter(testimonial => !showPinnedOnly || testimonial.isPinned)
              .map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TestimonialBubble
                    testimonial={testimonial}
                    isAuthor={isAuthor}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onPin={handlePin}
                  />
                </motion.div>
              ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("no_testimonials")}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <TestimonialInput
          onSubmit={handleSubmitTestimonial}
          placeholder="Write your testimonial..."
        />
      </div>
    </Container>
  );
};

export default TestimonialsModule;

