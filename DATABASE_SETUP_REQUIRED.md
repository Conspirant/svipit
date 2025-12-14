# Database Setup Required

## ⚠️ Important: Run Database Migrations

The application is trying to use database tables and functions that don't exist yet. You need to run the migrations to create them.

## Required Migrations

### 1. Payment Escrow System
**File:** `supabase/migrations/20251215000000_payment_escrow_system.sql`

This creates:
- `transactions` table
- `transaction_verifications` table
- `transaction_logs` table
- `generate_transaction_id()` function
- `verify_payment()` function
- `approve_work()` function

### 2. Chat Security System
**File:** `supabase/migrations/20251215000001_chat_security.sql`

This creates:
- `reports` table
- `blocks` table
- `message_moderation` table
- `user_safety_scores` table
- Message metadata columns

## How to Apply Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Run each migration in order

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase migration up
```

### Option 3: Manual Application
1. Open each SQL file
2. Copy all the SQL code
3. Paste into Supabase SQL Editor
4. Click "Run"

## Current Status

The application will work **without** these tables, but with limited functionality:
- ✅ Chat messages will work
- ✅ Basic features will work
- ❌ Payment transactions won't be saved to database
- ❌ Block/report features won't work
- ❌ Transaction history won't be tracked

## After Running Migrations

Once you run the migrations:
- ✅ All payment features will work fully
- ✅ Transaction history will be saved
- ✅ Block/report features will work
- ✅ Safety scores will be tracked
- ✅ All security features will be active

## Quick Fix for Now

The code has been updated to handle missing tables gracefully, so the app won't crash. However, for full functionality, please run the migrations.
