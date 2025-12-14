-- Payment Escrow System for Secure Transactions
-- This ensures payments are held until work is verified and approved

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE, -- Unique transaction reference
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'paid', 'work_in_progress', 'work_submitted', 'approved', 'released', 'disputed', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'upi',
  upi_id TEXT, -- Seller's UPI ID for payment
  upi_qr_data TEXT, -- Encrypted/secure QR code data
  payment_proof_url TEXT, -- Screenshot/proof of payment
  payment_verified_at TIMESTAMP WITH TIME ZONE,
  work_description TEXT,
  work_files JSONB DEFAULT '[]', -- Array of file URLs
  work_preview_url TEXT, -- Preview link for buyer
  buyer_approval BOOLEAN DEFAULT false,
  buyer_approval_at TIMESTAMP WITH TIME ZONE,
  buyer_feedback TEXT,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-cancel if not paid within timeframe
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT buyer_seller_different CHECK (buyer_id != seller_id)
);

-- Create transaction_verifications table for payment proof verification
CREATE TABLE public.transaction_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('payment_proof', 'work_submission', 'buyer_approval', 'dispute')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin/system verification
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  verification_notes TEXT,
  evidence_urls JSONB DEFAULT '[]', -- Screenshots, documents, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_logs for audit trail
CREATE TABLE public.transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'payment_initiated', 'payment_verified', 'work_submitted', 'approved', 'released', etc.
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Transaction Verifications RLS Policies
CREATE POLICY "Users can view verifications for their transactions" 
ON public.transaction_verifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = transaction_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Users can create verifications for their transactions" 
ON public.transaction_verifications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = transaction_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Transaction Logs RLS Policies
CREATE POLICY "Users can view logs for their transactions" 
ON public.transaction_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = transaction_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Function to generate unique transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  new_id := 'TXN' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
            LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.transactions WHERE transaction_id = new_id) LOOP
    new_id := 'TXN' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
              LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log transaction actions
CREATE OR REPLACE FUNCTION log_transaction_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.transaction_logs (transaction_id, action, performed_by, details)
  VALUES (
    NEW.id,
    CASE 
      WHEN OLD.status IS NULL THEN 'created'
      WHEN NEW.status != OLD.status THEN NEW.status
      ELSE 'updated'
    END,
    auth.uid(),
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changes', jsonb_build_object(
        'buyer_approval', CASE WHEN NEW.buyer_approval != OLD.buyer_approval THEN NEW.buyer_approval ELSE NULL END,
        'payment_verified', CASE WHEN NEW.payment_verified_at IS NOT NULL AND OLD.payment_verified_at IS NULL THEN true ELSE NULL END
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for transaction logging
CREATE TRIGGER transaction_log_trigger
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_action();

-- Function to auto-update timestamps
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_verifications_updated_at
BEFORE UPDATE ON public.transaction_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to verify payment and update transaction status
CREATE OR REPLACE FUNCTION verify_payment(transaction_uuid UUID, payment_proof_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  txn_record RECORD;
BEGIN
  SELECT * INTO txn_record FROM public.transactions WHERE id = transaction_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  IF txn_record.status != 'payment_pending' THEN
    RAISE EXCEPTION 'Transaction is not in payment_pending status';
  END IF;
  
  -- Update transaction with payment proof
  UPDATE public.transactions
  SET 
    payment_proof_url = verify_payment.payment_proof_url,
    status = 'paid',
    payment_verified_at = now(),
    updated_at = now()
  WHERE id = transaction_uuid;
  
  -- Create verification record
  INSERT INTO public.transaction_verifications (
    transaction_id,
    verification_type,
    verification_status,
    evidence_urls
  ) VALUES (
    transaction_uuid,
    'payment_proof',
    'pending',
    jsonb_build_array(payment_proof_url)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve work and release payment
CREATE OR REPLACE FUNCTION approve_work(transaction_uuid UUID, buyer_feedback TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  txn_record RECORD;
BEGIN
  SELECT * INTO txn_record FROM public.transactions WHERE id = transaction_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  IF txn_record.buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can approve work';
  END IF;
  
  IF txn_record.status != 'work_submitted' THEN
    RAISE EXCEPTION 'Work must be submitted before approval';
  END IF;
  
  -- Update transaction
  UPDATE public.transactions
  SET 
    buyer_approval = true,
    buyer_approval_at = now(),
    buyer_feedback = approve_work.buyer_feedback,
    status = 'approved',
    released_at = now(),
    updated_at = now()
  WHERE id = transaction_uuid;
  
  -- Create verification record
  INSERT INTO public.transaction_verifications (
    transaction_id,
    verification_type,
    verification_status
  ) VALUES (
    transaction_uuid,
    'buyer_approval',
    'approved'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_transaction_id ON public.transactions(transaction_id);
CREATE INDEX idx_transaction_verifications_transaction ON public.transaction_verifications(transaction_id);
CREATE INDEX idx_transaction_logs_transaction ON public.transaction_logs(transaction_id);

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
