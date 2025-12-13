"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

import Container from "@/common/components/elements/Container";
import TestimonialBubble from "./components/TestimonialBubble";
import TestimonialInput from "./components/TestimonialInput";

import { Testimonial } from "@/common/types/testimoni";

const TestimonialsModule = () => {
  const t = useTranslations("TestimoniPage");
  const { data: session } = useSession();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAuthor = session?.user?.email === process.env.NEXT_PUBLIC_AUTHOR_EMAIL;

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
    try {
      const response = await fetch("/api/testimoni", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, message }),
      });

      if (response.ok) {
        await fetchTestimonials();
        // Scroll to bottom after new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Failed to submit testimonial:", error);
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

  if (loading) {
    return (
      <Container className="py-8">
        <div className="text-center">{t("loading")}</div>
      </Container>
    );
  }

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

      {/* Chat-like Container */}
      <div className="bg-neutral-900 rounded-lg border border-neutral-700 h-[600px] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {testimonials.length > 0 ? (
            testimonials.map((testimonial) => (
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

