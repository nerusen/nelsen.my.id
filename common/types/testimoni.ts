export interface Testimonial {
  id: string;
  userId: string;
  username: string;
  userImage?: string;
  rating: number;
  message: string;
  reply?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialRequest {
  rating: number;
  message: string;
}

export interface ReplyTestimonialRequest {
  reply: string;
}
