// Test script untuk verifikasi setup Supabase Storage
// Jalankan dengan: node test-supabase-storage.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables tidak ditemukan!');
  console.log('Pastikan .env.local memiliki:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=...');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseSetup() {
  console.log('🧪 Testing Supabase Storage Setup...\n');

  try {
    // Test 1: List buckets
    console.log('1️⃣ Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Bucket access failed:', bucketsError.message);
      return;
    }

    const chatBucket = buckets.find(b => b.name === 'chat-attachments');
    if (!chatBucket) {
      console.error('❌ Bucket "chat-attachments" tidak ditemukan!');
      console.log('📝 Buat bucket di Supabase Dashboard > Storage');
      return;
    }

    console.log('✅ Bucket "chat-attachments" ditemukan');

    // Test 2: Test upload (file dummy)
    console.log('\n2️⃣ Testing file upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testPath = `test_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(testPath, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.log('📝 Periksa Storage Policies di bucket');
      return;
    }

    console.log('✅ Upload berhasil');

    // Test 3: Test get public URL
    console.log('\n3️⃣ Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(testPath);

    if (urlData?.publicUrl) {
      console.log('✅ Public URL generated:', urlData.publicUrl);
    } else {
      console.error('❌ Public URL generation failed');
    }

    // Cleanup: Delete test file
    console.log('\n4️⃣ Cleaning up test file...');
    await supabase.storage
      .from('chat-attachments')
      .remove([testPath]);

    console.log('✅ Test file deleted');

    console.log('\n🎉 Semua test berhasil! Storage siap digunakan.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseSetup();
