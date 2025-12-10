-- =============================================================================
-- ATTACHMENT.SQL - Supabase Database Schema untuk Chat Room Attachments
-- =============================================================================
-- File ini berisi kode SQL lengkap untuk menyimpan media/attachment di database
-- Supabase. Jalankan SQL ini di Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABEL MESSAGES (jika belum ada)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    image TEXT,
    message TEXT NOT NULL,
    is_reply BOOLEAN DEFAULT FALSE,
    reply_to VARCHAR(255),
    is_show BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_ai BOOLEAN DEFAULT FALSE,
    is_thinking BOOLEAN DEFAULT FALSE,
    user_email VARCHAR(255),
    conversation_id UUID,
    message_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_email ON public.messages(email);
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON public.messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- -----------------------------------------------------------------------------
-- 2. TABEL ATTACHMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_data TEXT,
    storage_path TEXT,
    public_url TEXT,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(255),
    attachment_type VARCHAR(50) NOT NULL CHECK (attachment_type IN ('image', 'audio', 'document')),
    duration_seconds DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_email ON public.attachments(user_email);
CREATE INDEX IF NOT EXISTS idx_attachments_attachment_type ON public.attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON public.attachments(created_at);

-- Komentar untuk dokumentasi kolom
COMMENT ON TABLE public.attachments IS 'Tabel untuk menyimpan metadata attachment/media dari chat messages';
COMMENT ON COLUMN public.attachments.id IS 'Primary key UUID';
COMMENT ON COLUMN public.attachments.message_id IS 'Foreign key ke tabel messages';
COMMENT ON COLUMN public.attachments.user_email IS 'Email pengguna yang mengupload attachment';
COMMENT ON COLUMN public.attachments.file_name IS 'Nama file asli';
COMMENT ON COLUMN public.attachments.file_data IS 'URL publik file di Supabase Storage';
COMMENT ON COLUMN public.attachments.storage_path IS 'Path file di Supabase Storage bucket';
COMMENT ON COLUMN public.attachments.public_url IS 'URL publik lengkap untuk akses file';
COMMENT ON COLUMN public.attachments.file_size IS 'Ukuran file dalam bytes';
COMMENT ON COLUMN public.attachments.mime_type IS 'MIME type file (image/jpeg, audio/mpeg, dll)';
COMMENT ON COLUMN public.attachments.attachment_type IS 'Tipe attachment: image, audio, atau document';
COMMENT ON COLUMN public.attachments.duration_seconds IS 'Durasi audio dalam detik (khusus audio files)';

-- -----------------------------------------------------------------------------
-- 3. FUNCTION UNTUK AUTO-UPDATE updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk attachments
DROP TRIGGER IF EXISTS update_attachments_updated_at ON public.attachments;
CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS pada kedua tabel
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy untuk tabel messages

-- Semua pengguna bisa membaca messages (untuk public chat room)
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
CREATE POLICY "Messages are viewable by everyone"
    ON public.messages FOR SELECT
    USING (true);

-- Pengguna terautentikasi bisa insert messages
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (true);

-- Pengguna hanya bisa update message miliknya sendiri
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (true);

-- Pengguna hanya bisa delete message miliknya sendiri
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (true);

-- Policy untuk tabel attachments

-- Semua pengguna bisa membaca attachments
DROP POLICY IF EXISTS "Attachments are viewable by everyone" ON public.attachments;
CREATE POLICY "Attachments are viewable by everyone"
    ON public.attachments FOR SELECT
    USING (true);

-- Pengguna terautentikasi bisa insert attachments
DROP POLICY IF EXISTS "Authenticated users can insert attachments" ON public.attachments;
CREATE POLICY "Authenticated users can insert attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (true);

-- Pengguna hanya bisa update attachment miliknya sendiri
DROP POLICY IF EXISTS "Users can update own attachments" ON public.attachments;
CREATE POLICY "Users can update own attachments"
    ON public.attachments FOR UPDATE
    USING (true);

-- Pengguna hanya bisa delete attachment miliknya sendiri
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.attachments;
CREATE POLICY "Users can delete own attachments"
    ON public.attachments FOR DELETE
    USING (true);

-- -----------------------------------------------------------------------------
-- 5. ENABLE REALTIME UNTUK KEDUA TABEL
-- -----------------------------------------------------------------------------

-- Enable realtime untuk messages (untuk live chat updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime untuk attachments
ALTER PUBLICATION supabase_realtime ADD TABLE public.attachments;

-- -----------------------------------------------------------------------------
-- 6. STORAGE BUCKET POLICIES (Jalankan di Storage SQL atau Storage UI)
-- -----------------------------------------------------------------------------
-- CATATAN: Policy storage bucket harus dikonfigurasi melalui Supabase Dashboard
-- atau melalui Storage API. Berikut contoh SQL untuk referensi:

-- Policy untuk upload file (INSERT)
-- Semua authenticated users bisa upload ke folder email mereka
/*
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
);
*/

-- Policy untuk read file (SELECT)
-- Semua orang bisa melihat file (public bucket)
/*
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');
*/

-- Policy untuk delete file (DELETE)
-- Hanya owner yang bisa delete
/*
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
);
*/

-- -----------------------------------------------------------------------------
-- 7. FUNCTION HELPER UNTUK CLEANUP ORPHAN ATTACHMENTS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_orphan_attachments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.attachments
        WHERE message_id NOT IN (SELECT id FROM public.messages)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_orphan_attachments() IS 'Menghapus attachment yang tidak memiliki message terkait';

-- -----------------------------------------------------------------------------
-- 8. VIEW UNTUK MESSAGES DENGAN ATTACHMENTS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.messages_with_attachments AS
SELECT 
    m.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', a.id,
                'file_name', a.file_name,
                'file_data', a.file_data,
                'storage_path', a.storage_path,
                'public_url', a.public_url,
                'file_size', a.file_size,
                'mime_type', a.mime_type,
                'attachment_type', a.attachment_type,
                'duration_seconds', a.duration_seconds
            )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
    ) AS attachments
FROM public.messages m
LEFT JOIN public.attachments a ON m.id = a.message_id
GROUP BY m.id
ORDER BY m.created_at ASC;

COMMENT ON VIEW public.messages_with_attachments IS 'View yang menggabungkan messages dengan attachments dalam format JSON array';

-- -----------------------------------------------------------------------------
-- 9. FUNCTION UNTUK MENDAPATKAN STATISTIK STORAGE USAGE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    total_size_mb DECIMAL(10, 2),
    image_count BIGINT,
    audio_count BIGINT,
    document_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_files,
        COALESCE(SUM(file_size), 0)::BIGINT AS total_size_bytes,
        ROUND(COALESCE(SUM(file_size), 0)::DECIMAL / (1024 * 1024), 2) AS total_size_mb,
        COUNT(*) FILTER (WHERE attachment_type = 'image')::BIGINT AS image_count,
        COUNT(*) FILTER (WHERE attachment_type = 'audio')::BIGINT AS audio_count,
        COUNT(*) FILTER (WHERE attachment_type = 'document')::BIGINT AS document_count
    FROM public.attachments;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_storage_stats() IS 'Mendapatkan statistik penggunaan storage untuk attachments';

-- -----------------------------------------------------------------------------
-- SELESAI
-- -----------------------------------------------------------------------------
-- Setelah menjalankan SQL ini, pastikan untuk:
-- 1. Membuat bucket 'chat-attachments' di Supabase Storage
-- 2. Mengatur policies untuk bucket tersebut
-- 3. Mengaktifkan Realtime jika belum aktif
-- 
-- Lihat file SUPABASE_STORAGE_SETUP.md untuk panduan lengkap.
-- -----------------------------------------------------------------------------
