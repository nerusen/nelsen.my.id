export interface MessageProps {
  id: string;
  name: string;
  email: string;
  image?: string;
  message: string;
  attachments?: AttachmentProps[];
  is_reply?: boolean;
  reply_to?: string;
  created_at: string;
  updated_at?: string;
  is_show?: boolean;
  is_pinned?: boolean;
  is_ai?: boolean;
  is_thinking?: boolean;
  user_email?: string;
  conversation_id?: string;
  message_type?: string;
  metadata?: any;
}

export interface AttachmentProps {
  id: string;
  file_name: string;
  file_data: string;
  storage_path?: string;
  public_url?: string;
  file_size: number;
  mime_type: string;
  attachment_type: 'image' | 'audio' | 'document';
  duration_seconds?: number;
}

export interface ChatListProps {
  messages: MessageProps[];
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
}
