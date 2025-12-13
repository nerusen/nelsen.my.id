"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import Container from "@/common/components/elements/Container";
import RatingModal from "./components/RatingModal";
import TestimonialBubble from "./components/TestimonialBubble";

import { Testimonial } from "@/common/types/testimoni";

export default function TestimonialsModule() {
  const t = useTranslations("TestimoniPage");
  const { data: session } = useSession();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAuthor = session?.user?.email === process.env.NEXT_PUBLIC_AUTHOR_EMAIL;

  useEffect(() => {
    fetchTestimonials();
  }, []);

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

  const handleAddTestimonial = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
        setIsModalOpen(false);
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
    <Container className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("title")}
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {t("description")}
        </p>
      </div>

      <div className="mb-6 flex justify-center">
        <button
          onClick={handleAddTestimonial}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          {t("add_testimonial")}
        </button>
      </div>

      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <TestimonialBubble
            key={testimonial.id}
            testimonial={testimonial}
            isAuthor={isAuthor}
            currentUserId={session?.user?.id}
            onReply={handleReply}
            onDelete={handleDelete}
            onPin={handlePin}
          />
        ))}
      </div>

      <RatingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTestimonial}
      />
    </Container>
  );
}
