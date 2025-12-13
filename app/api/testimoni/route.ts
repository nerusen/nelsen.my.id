import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { createClient } from "@/common/utils/server";
import { authOptions } from "@/common/libs/next-auth";
import { CreateTestimonialRequest } from "@/common/types/testimoni";

export async function GET() {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch testimonials" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: CreateTestimonialRequest = await request.json();
    const { rating, message } = body;

    if (!rating || !message || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating or message" },
        { status: 400 }
      );
    }

    // Check if user already has a testimonial
    const { data: existing } = await supabase
      .from("testimonials")
      .select("id")
      .eq("user_email", session.user.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a testimonial" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        user_email: session.user.email,
        username: session.user.name || "Anonymous",
        user_image: session.user.image,
        rating,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
