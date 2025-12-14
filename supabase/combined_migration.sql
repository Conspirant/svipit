-- Combined Migration Script for S.V.I.P Connect
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/njijopnitgrwhppsbfoe/sql/new)

-- ================================================
-- MIGRATION 1: Profiles Table
-- ================================================
-- Create profiles table for student users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  college TEXT,
  college_domain TEXT,
  bio TEXT,
  trust_intro TEXT,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  trust_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- MIGRATION 2: Posts, Conversations, Messages, etc.
-- ================================================
-- Create posts table for requests and offers
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('request', 'offer')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  skills TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create endorsements table
CREATE TABLE public.endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endorser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(endorser_id, endorsed_id, skill)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Create collaborations table (for tracking previous work together)
CREATE TABLE public.collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view active posts" ON public.posts FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
);
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

-- Endorsements policies
CREATE POLICY "Anyone can view endorsements" ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "Users can create endorsements" ON public.endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id AND endorser_id != endorsed_id);
CREATE POLICY "Users can delete their own endorsements" ON public.endorsements FOR DELETE USING (auth.uid() = endorser_id);

-- Badges policies
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- Collaborations policies
CREATE POLICY "Users can view their collaborations" ON public.collaborations FOR SELECT USING (auth.uid() = user_1 OR auth.uid() = user_2);
CREATE POLICY "Users can create collaborations" ON public.collaborations FOR INSERT WITH CHECK (auth.uid() = user_1 OR auth.uid() = user_2);

-- Triggers for updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ================================================
-- MIGRATION 3: Public Profiles View
-- ================================================
-- First, drop the existing overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that hides email from other users
-- Users can see their own full profile
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a view for public profile data without email
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  college,
  college_domain,
  bio,
  trust_intro,
  skills,
  trust_score,
  avatar_url,
  is_verified,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- ================================================
-- MIGRATION 4: Payment Escrow System (TRANSACTIONS)
-- ================================================
-- Create transactions table
CREATE TABLE public.transactions (
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

-- Create transaction_verifications table
CREATE TABLE public.transaction_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('payment_proof', 'work_submission', 'buyer_approval', 'dispute')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  verification_notes TEXT,
  evidence_urls JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_logs table
CREATE TABLE public.transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
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

-- Trigger for auto-update timestamps
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaction_verifications_updated_at
BEFORE UPDATE ON public.transaction_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_transaction_id ON public.transactions(transaction_id);
CREATE INDEX idx_transaction_verifications_transaction ON public.transaction_verifications(transaction_id);
CREATE INDEX idx_transaction_logs_transaction ON public.transaction_logs(transaction_id);

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ================================================
-- MIGRATION 5: Chat Security
-- ================================================
-- Add message metadata columns
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contains_links BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS link_count INTEGER DEFAULT 0;

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'scam', 'harassment', 'inappropriate', 'suspicious_payment', 'other')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reporter_reported_different CHECK (reporter_id != reported_user_id)
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_user_id),
  CONSTRAINT blocker_blocked_different CHECK (blocker_id != blocked_user_id)
);

-- Create message_moderation table
CREATE TABLE IF NOT EXISTS public.message_moderation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  moderation_type TEXT NOT NULL CHECK (moderation_type IN ('auto_flagged', 'suspicious_link', 'spam_detected', 'payment_related')),
  confidence_score DECIMAL(3, 2) DEFAULT 0.5,
  action_taken TEXT CHECK (action_taken IN ('flagged', 'blocked', 'warned', 'none')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_safety_scores table
CREATE TABLE IF NOT EXISTS public.user_safety_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  safety_score INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
  reports_count INTEGER DEFAULT 0,
  blocks_count INTEGER DEFAULT 0,
  flagged_messages_count INTEGER DEFAULT 0,
  last_reported_at TIMESTAMP WITH TIME ZONE,
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_safety_scores ENABLE ROW LEVEL SECURITY;

-- Reports RLS Policies
CREATE POLICY "Users can view their own reports" 
ON public.reports FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Blocks RLS Policies
CREATE POLICY "Users can view their own blocks" 
ON public.blocks FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" 
ON public.blocks FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" 
ON public.blocks FOR DELETE 
USING (auth.uid() = blocker_id);

-- Message Moderation RLS Policies
CREATE POLICY "Users can view moderation for their messages" 
ON public.message_moderation FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_id 
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

-- User Safety Scores RLS Policies
CREATE POLICY "Users can view their own safety score" 
ON public.user_safety_scores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public safety scores" 
ON public.user_safety_scores FOR SELECT 
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON public.messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ================================================
-- DONE! All tables have been created.
-- ================================================
