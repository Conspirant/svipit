-- Chat Security & Moderation System
-- Prevents scams, spam, and malicious activity in chats

-- Add message metadata columns
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contains_links BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS link_count INTEGER DEFAULT 0;

-- Create reports table for reporting suspicious users/messages
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

-- Create message_moderation table for automated moderation
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

-- Function to update safety score
CREATE OR REPLACE FUNCTION update_user_safety_score(user_uuid UUID)
RETURNS void AS $$
DECLARE
  reports_count INTEGER;
  blocks_count INTEGER;
  flagged_count INTEGER;
  new_score INTEGER;
BEGIN
  -- Count reports
  SELECT COUNT(*) INTO reports_count
  FROM public.reports
  WHERE reported_user_id = user_uuid
  AND status != 'dismissed';
  
  -- Count blocks
  SELECT COUNT(*) INTO blocks_count
  FROM public.blocks
  WHERE blocked_user_id = user_uuid;
  
  -- Count flagged messages
  SELECT COUNT(*) INTO flagged_count
  FROM public.messages m
  WHERE m.sender_id = user_uuid
  AND m.is_flagged = true;
  
  -- Calculate safety score (100 - penalties)
  new_score := 100 - (reports_count * 10) - (blocks_count * 5) - (flagged_count * 2);
  new_score := GREATEST(0, LEAST(100, new_score));
  
  -- Update or insert safety score
  INSERT INTO public.user_safety_scores (user_id, safety_score, reports_count, blocks_count, flagged_messages_count, updated_at)
  VALUES (user_uuid, new_score, reports_count, blocks_count, flagged_count, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    safety_score = new_score,
    reports_count = reports_count,
    blocks_count = blocks_count,
    flagged_messages_count = flagged_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid UUID, blocked_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocks
    WHERE blocker_id = blocker_uuid
    AND blocked_user_id = blocked_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update safety score when report is created
CREATE OR REPLACE FUNCTION trigger_update_safety_score_on_report()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_safety_score(NEW.reported_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safety_score_on_report
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION trigger_update_safety_score_on_report();

-- Trigger to update safety score when message is flagged
CREATE OR REPLACE FUNCTION trigger_update_safety_score_on_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_flagged = true AND (OLD.is_flagged IS NULL OR OLD.is_flagged = false) THEN
    PERFORM update_user_safety_score(NEW.sender_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safety_score_on_flag
AFTER UPDATE OF is_flagged ON public.messages
FOR EACH ROW
EXECUTE FUNCTION trigger_update_safety_score_on_flag();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON public.messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Function to auto-flag suspicious messages
CREATE OR REPLACE FUNCTION auto_flag_suspicious_message()
RETURNS TRIGGER AS $$
DECLARE
  link_count INTEGER;
  contains_payment BOOLEAN;
BEGIN
  -- Count links in message
  link_count := (SELECT array_length(string_to_array(NEW.content, 'http'), 1) - 1);
  link_count := GREATEST(0, COALESCE(link_count, 0));
  
  -- Check for payment keywords
  contains_payment := NEW.content ~* '(upi|payment|pay|transfer|money|₹|rupee|bank|account)';
  
  -- Update message metadata
  NEW.contains_links := link_count > 0;
  NEW.link_count := link_count;
  
  -- Auto-flag if suspicious
  IF link_count > 3 OR contains_payment THEN
    NEW.is_flagged := true;
    NEW.flag_reason := CASE
      WHEN link_count > 3 THEN 'Too many links'
      WHEN contains_payment THEN 'Contains payment-related content'
      ELSE 'Suspicious content detected'
    END;
    
    -- Log moderation action
    INSERT INTO public.message_moderation (message_id, moderation_type, confidence_score, action_taken)
    VALUES (
      NEW.id,
      CASE
        WHEN link_count > 3 THEN 'suspicious_link'
        WHEN contains_payment THEN 'payment_related'
        ELSE 'auto_flagged'
      END,
      0.7,
      'flagged'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_flag_suspicious_messages
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION auto_flag_suspicious_message();
