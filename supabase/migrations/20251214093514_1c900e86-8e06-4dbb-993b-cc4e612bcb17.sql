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