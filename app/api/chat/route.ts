import { createClient } from "@/common/utils/server";
import { NextResponse } from "next/server";

export const GET = async () => {
  const supabase = createClient();
  try {
    // Get messages with their associated attachments
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        *,
        attachments (
          id,
          file_name,
          file_data,
          file_size,
          mime_type,
          attachment_type,
          duration_seconds
        )
      `)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Transform the data to include attachments array
    const transformedMessages = messages?.map(message => ({
      ...message,
      attachments: message.attachments || []
    }));

    return NextResponse.json(transformedMessages, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  const supabase = createClient();
  try {
    const body = await req.json();
    const { attachments, ...messageData } = body;

    // Insert message first
    const { data: messageResult, error: messageError } = await supabase
      .from("messages")
      .insert([messageData])
      .select()
      .single();

    if (messageError) throw messageError;

    // If there are attachments, insert them
    if (attachments && attachments.length > 0) {
      const attachmentData = attachments.map((attachment: any) => ({
        message_id: messageResult.id,
        user_email: messageData.email,
        file_name: attachment.file_name,
        file_data: attachment.file_data, // This is now the public URL
        storage_path: attachment.storage_path,
        public_url: attachment.public_url,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        attachment_type: attachment.attachment_type,
        duration_seconds: attachment.duration_seconds,
      }));

      const { error: attachmentError } = await supabase
        .from("attachments")
        .insert(attachmentData);

      if (attachmentError) throw attachmentError;
    }

    return NextResponse.json("Data saved successfully", { status: 200 });
  } catch (error) {
    console.error("Error saving message with attachments:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
};

export const PATCH = async (req: Request) => {
  const supabase = createClient();
  try {
    const { id, is_pinned, email } = await req.json();

    const authorEmail = process.env.NEXT_PUBLIC_AUTHOR_EMAIL;
    const isAuthor = email === authorEmail;

    // First, check if the message exists
    const { data: existingMessage, error: fetchError } = await supabase
      .from("messages")
      .select("email")
      .eq("id", id)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 },
      );
    }

    // Only author can pin/unpin messages
    if (!isAuthor) {
      return NextResponse.json(
        { message: "Unauthorized to pin/unpin this message" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .update({ is_pinned })
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
};
