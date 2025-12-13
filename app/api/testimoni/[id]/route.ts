import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/common/libs/next-auth";

import { createClient } from "@/common/utils/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const testimonialId = params.id;
    const authorEmail = process.env.NEXT_PUBLIC_AUTHOR_EMAIL;
    const isAuthor = session.user.email === authorEmail;

    // Get the testimonial to check ownership
    const { data: testimonial, error: fetchError } = await supabase
      .from("testimonials")
      .select("user_email")
      .eq("id", testimonialId)
      .single();

    if (fetchError || !testimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    // Only author or testimonial owner can delete
    if (!isAuthor && testimonial.user_email !== session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized to delete this testimonial" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", testimonialId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const testimonialId = params.id;
    const authorEmail = process.env.NEXT_PUBLIC_AUTHOR_EMAIL;
    const isAuthor = session.user.email === authorEmail;

    if (!isAuthor) {
      return NextResponse.json(
        { error: "Only author can pin testimonials" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("testimonials")
      .update({ is_pinned: true })
      .eq("id", testimonialId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to pin testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
