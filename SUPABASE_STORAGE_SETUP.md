# Panduan Setup Supabase Storage untuk Chat Attachments

Panduan ini menjelaskan langkah-langkah lengkap untuk mengatur Supabase Storage bucket agar media/attachment pada chat room dapat tersimpan dengan benar.

## Daftar Isi

1. [Prasyarat](#prasyarat)
2. [Membuat Storage Bucket](#membuat-storage-bucket)
3. [Mengatur Bucket Policies](#mengatur-bucket-policies)
4. [Menjalankan SQL Database](#menjalankan-sql-database)
5. [Environment Variables](#environment-variables)
6. [Testing Setup](#testing-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- Akun Supabase dengan project yang sudah dibuat
- Akses ke Supabase Dashboard
- Environment variables yang diperlukan:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Membuat Storage Bucket

### Langkah 1: Buka Supabase Dashboard

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik menu **Storage** di sidebar kiri

### Langkah 2: Buat Bucket Baru

1. Klik tombol **New bucket** di pojok kanan atas
2. Isi detail bucket:
   - **Name**: `chat-attachments`
   - **Public bucket**: ✅ Centang opsi ini (untuk akses publik ke file)
   - **Allowed MIME types**: Biarkan kosong atau isi:
     ```
     image/jpeg
     image/png
     image/gif
     image/webp
     audio/mpeg
     audio/mp3
     audio/wav
     audio/ogg
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     text/plain
     ```
   - **File size limit**: `52428800` (50 MB dalam bytes)
3. Klik **Create bucket**

### Langkah 3: Verifikasi Bucket

Setelah dibuat, bucket `chat-attachments` akan muncul di daftar buckets. Pastikan:
- Status bucket adalah **Public**
- Nama bucket persis `chat-attachments` (case-sensitive)

---

## Mengatur Bucket Policies

Policies menentukan siapa yang bisa mengakses dan memodifikasi file di bucket.

### Langkah 1: Buka Bucket Policies

1. Di halaman Storage, klik bucket `chat-attachments`
2. Klik tab **Policies** di bagian atas

### Langkah 2: Buat Policy untuk SELECT (Read/Download)

1. Klik **New policy**
2. Pilih **For full customization** atau **Get started quickly**
3. Isi detail policy:

**Opsi 1: Menggunakan Template (Mudah)**
- Pilih template: **Allow access to JPG files in a public folder to anonymous users**
- Modifikasi sesuai kebutuhan

**Opsi 2: Custom Policy (Rekomendasi)**
- **Policy name**: `Allow public read access`
- **Allowed operation**: `SELECT`
- **Target roles**: Pilih semua atau `anon, authenticated`
- **Policy definition** (SQL):
```sql
true
```

Klik **Review** lalu **Save policy**

### Langkah 3: Buat Policy untuk INSERT (Upload)

1. Klik **New policy**
2. Pilih **For full customization**
3. Isi detail:
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition** (SQL):
```sql
true
```

Klik **Review** lalu **Save policy**

### Langkah 4: Buat Policy untuk UPDATE (Opsional)

1. Klik **New policy**
2. Pilih **For full customization**
3. Isi detail:
   - **Policy name**: `Allow authenticated updates`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **Policy definition** (SQL):
```sql
true
```

### Langkah 5: Buat Policy untuk DELETE

1. Klik **New policy**
2. Pilih **For full customization**
3. Isi detail:
   - **Policy name**: `Allow authenticated deletes`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **Policy definition** (SQL):
```sql
true
```

### Ringkasan Policies

Setelah selesai, Anda harus memiliki policies berikut:

| Policy Name | Operation | Roles | Definition |
|------------|-----------|-------|------------|
| Allow public read access | SELECT | anon, authenticated | `true` |
| Allow authenticated uploads | INSERT | authenticated | `true` |
| Allow authenticated updates | UPDATE | authenticated | `true` |
| Allow authenticated deletes | DELETE | authenticated | `true` |

---

## Menjalankan SQL Database

### Langkah 1: Buka SQL Editor

1. Di Supabase Dashboard, klik menu **SQL Editor** di sidebar
2. Klik **New query**

### Langkah 2: Jalankan attachment.sql

1. Buka file `attachment.sql` di project Anda
2. Copy seluruh isi file
3. Paste ke SQL Editor
4. Klik **Run** atau tekan `Ctrl/Cmd + Enter`

### Langkah 3: Verifikasi Tabel

Setelah SQL berhasil dijalankan, verifikasi di **Table Editor**:

1. Klik menu **Table Editor** di sidebar
2. Pastikan tabel berikut ada:
   - `messages` - Tabel pesan chat
   - `attachments` - Tabel metadata attachment

### Langkah 4: Enable Realtime

1. Klik menu **Database** di sidebar
2. Pilih **Replication**
3. Pastikan tabel `messages` dan `attachments` ada di daftar
4. Jika belum, klik tabel tersebut untuk menambahkan ke replication

---

## Environment Variables

Pastikan file `.env.local` Anda memiliki variabel berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Author email for admin privileges
NEXT_PUBLIC_AUTHOR_EMAIL=your-email@example.com
```

### Cara Mendapatkan Keys

1. Buka Supabase Dashboard
2. Klik **Settings** (ikon gear) di sidebar
3. Pilih **API**
4. Copy values berikut:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (jangan expose ke client!)

---

## Testing Setup

### Test 1: Menggunakan Script Test

Jalankan script test yang sudah disediakan:

```bash
node test-supabase-storage.js
```

Output yang diharapkan:
```
🧪 Testing Supabase Storage Setup...

1️⃣ Testing bucket access...
✅ Bucket "chat-attachments" ditemukan

2️⃣ Testing file upload...
✅ Upload berhasil

3️⃣ Testing public URL generation...
✅ Public URL generated: https://xxx.supabase.co/storage/v1/object/public/...

4️⃣ Cleaning up test file...
✅ Test file deleted

🎉 Semua test berhasil! Storage siap digunakan.
```

### Test 2: Manual Testing via Dashboard

1. Buka Supabase Storage
2. Klik bucket `chat-attachments`
3. Coba upload file secara manual dengan klik **Upload files**
4. Setelah upload, klik file dan salin **Public URL**
5. Buka URL di browser baru - file harus dapat diakses

### Test 3: Testing di Aplikasi

1. Jalankan aplikasi: `npm run dev`
2. Login ke chat room
3. Coba kirim pesan dengan attachment (gambar/audio/dokumen)
4. Verifikasi:
   - File terupload tanpa error
   - Preview attachment muncul di chat
   - Attachment dapat didownload

---

## Troubleshooting

### Error: "Bucket not found"

**Penyebab**: Bucket `chat-attachments` belum dibuat atau nama salah.

**Solusi**:
1. Buka Supabase Storage
2. Verifikasi nama bucket persis `chat-attachments`
3. Jika belum ada, buat bucket baru sesuai panduan di atas

### Error: "Permission denied" saat upload

**Penyebab**: Storage policies belum dikonfigurasi dengan benar.

**Solusi**:
1. Buka bucket → Policies
2. Pastikan policy INSERT untuk authenticated users ada
3. Jika menggunakan anon key, tambahkan `anon` ke target roles

### Error: "Invalid JWT" atau "Not authenticated"

**Penyebab**: User belum login atau session expired.

**Solusi**:
1. Pastikan user login terlebih dahulu
2. Cek NextAuth session masih valid
3. Verifikasi environment variables benar

### File Uploaded tapi Tidak Muncul di Chat

**Penyebab**: Realtime tidak aktif atau attachment tidak tersimpan ke database.

**Solusi**:
1. Pastikan Realtime diaktifkan untuk tabel `messages` dan `attachments`
2. Cek Console browser untuk error
3. Verifikasi data attachment di tabel `attachments` via Table Editor

### Public URL Tidak Bisa Diakses

**Penyebab**: Bucket bukan public atau policy SELECT tidak ada.

**Solusi**:
1. Pastikan bucket dibuat sebagai **Public bucket**
2. Tambahkan policy SELECT dengan `true` sebagai definition
3. Coba generate public URL ulang

### File Terlalu Besar

**Penyebab**: File melebihi limit 50MB.

**Solusi**:
1. Kompres file sebelum upload
2. Atau naikkan limit di bucket settings (Settings → File size limit)

---

## Referensi

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/storage-from-upload)

---

## Catatan Penting

1. **Jangan** expose `SUPABASE_SERVICE_ROLE_KEY` ke client-side code
2. **Backup** data secara berkala
3. **Monitor** penggunaan storage di Supabase Dashboard
4. Untuk production, pertimbangkan **rate limiting** dan **file validation** tambahan

---

*Terakhir diupdate: Desember 2025*
