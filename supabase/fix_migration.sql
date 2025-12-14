-- FIX MIGRATION: Run this to complete the setup
-- Some tables may already exist, so we use IF NOT EXISTS

-- First, check what tables exist and add missing ones

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'paid', 'work_in_progress', 'work_submitted', 'approved', 'released', 'disputed', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'upi',
  upi_id TEXT,
  upi_qr_data TEXT,
  payment_proof_url TEXT,
  payment_verified_at TIMESTAMP WITH TIME ZONE,
  work_description TEXT,
  work_files JSONB DEFAULT '[]',
  work_preview_url TEXT,
  buyer_approval BOOLEAN DEFAULT false,
  buyer_approval_at TIMESTAMP WITH TIME ZONE,
  buyer_feedback TEXT,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT buyer_seller_different CHECK (buyer_id != seller_id)
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Buyers can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_user_id),
  CONSTRAINT blocker_blocked_different CHECK (blocker_id != blocked_user_id)
);

-- Enable RLS on blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocks;

CREATE POLICY "Users can view their own blocks" 
ON public.blocks FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" 
ON public.blocks FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" 
ON public.blocks FOR DELETE 
USING (auth.uid() = blocker_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_user_id);

-- Enable realtime for transactions (ignore error if already added)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Function to generate unique transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  new_id := 'TXN' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
            LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.transactions WHERE transaction_id = new_id) LOOP
    new_id := 'TXN' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
              LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- DONE! Essential tables for transactions are now set up.
