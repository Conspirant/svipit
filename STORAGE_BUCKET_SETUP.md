# Storage Bucket Setup Guide

## ⚠️ Error: "Bucket not found"

The payment system needs a Supabase Storage bucket to store payment proofs and work files.

## Quick Setup

### Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**
2. Click on **Storage** in the left sidebar
3. Click **New bucket**
4. Enter bucket name: `transaction-files`
5. Set to **Public** (or configure RLS policies)
6. Click **Create bucket**

### Step 2: Configure Bucket Settings

1. Click on the `transaction-files` bucket
2. Go to **Policies** tab
3. Add these policies:

#### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Users can upload transaction files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transaction-files');
```

#### Policy 2: Allow users to view files
```sql
CREATE POLICY "Users can view transaction files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'transaction-files');
```

#### Policy 3: Allow users to update their own files
```sql
CREATE POLICY "Users can update their transaction files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'transaction-files');
```

### Step 3: Set File Size Limits (Optional)

1. In bucket settings, set:
   - **Max file size**: 10MB (or as needed)
   - **Allowed MIME types**: `image/*`, `application/pdf`, `application/zip`, etc.

## Alternative: Make Bucket Public

If you want files to be publicly accessible:

1. In bucket settings, toggle **Public bucket** to ON
2. This allows anyone with the URL to access files

## What Gets Stored

- **Payment proofs**: Screenshots of payment confirmations
- **Work files**: Files submitted by sellers (code, documents, designs, etc.)

## After Setup

Once the bucket is created:
1. Refresh your app
2. Try uploading a payment proof again
3. It should work! ✅

## Troubleshooting

### "Bucket not found" error persists:
- Make sure bucket name is exactly `transaction-files`
- Check that bucket is created in the correct project
- Verify you're logged into the right Supabase project

### "Permission denied" error:
- Check bucket policies
- Make sure policies allow authenticated users
- Verify RLS is configured correctly

### Files not uploading:
- Check file size limits
- Verify MIME types are allowed
- Check browser console for specific errors

## Note

The app will work **without** the storage bucket by using data URLs (base64 encoded files), but:
- Files won't be stored permanently
- File sizes are limited (browser memory)
- Not ideal for production

For production, **always create the storage bucket**!
