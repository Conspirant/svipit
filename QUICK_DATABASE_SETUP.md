# Quick Database Setup Guide

## ⚠️ Error: "Could not find the table 'public.transactions'"

This error means the database migrations haven't been run yet. Here's how to fix it:

## Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

## Step 2: Run the Payment Migration

1. Open the file: `supabase/migrations/20251215000000_payment_escrow_system.sql`
2. Copy **ALL** the SQL code from that file
3. Paste it into the SQL Editor in Supabase
4. Click **Run** (or press Ctrl+Enter)
5. Wait for it to complete (should show "Success")

## Step 3: Run the Chat Security Migration

1. Open the file: `supabase/migrations/20251215000001_chat_security.sql`
2. Copy **ALL** the SQL code from that file
3. Paste it into the SQL Editor in Supabase
4. Click **Run**
5. Wait for it to complete

## Step 4: Verify Tables Were Created

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these new tables:
   - ✅ `transactions`
   - ✅ `transaction_verifications`
   - ✅ `transaction_logs`
   - ✅ `reports`
   - ✅ `blocks`
   - ✅ `message_moderation`
   - ✅ `user_safety_scores`

## Step 5: Refresh Your App

After running the migrations:
1. Refresh your browser
2. Try creating a transaction again
3. It should work now! ✅

## What Gets Created

### Payment Tables:
- `transactions` - Stores all payment transactions
- `transaction_verifications` - Payment proof verification
- `transaction_logs` - Complete audit trail

### Security Tables:
- `reports` - User reports
- `blocks` - User blocking
- `message_moderation` - Auto-moderation
- `user_safety_scores` - User safety tracking

### Functions:
- `generate_transaction_id()` - Creates unique transaction IDs
- `verify_payment()` - Verifies payment proof
- `approve_work()` - Approves work and releases payment

## Troubleshooting

### If you get "permission denied":
- Make sure you're logged into Supabase
- Check that you have admin access to the project

### If tables already exist:
- That's okay! The migrations will skip existing tables
- You can still run them safely

### If you see errors:
- Check the error message
- Make sure you copied the entire SQL file
- Try running one statement at a time

## Need Help?

If you're stuck:
1. Check the error message in Supabase SQL Editor
2. Make sure all SQL is copied correctly
3. Try running migrations one at a time

The app will work **without** these tables (using local storage), but for full functionality with transaction history, you need to run the migrations!
