import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Star, GraduationCap, Calendar, MessageCircle, Award, ThumbsUp, Check, Sparkles, ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { EndorseModal } from '@/components/profile/EndorseModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ProfileData {
  user_id: string;
  full_name: string;
  email: string;
  college: string;
  bio: string;
  trust_intro: string;
  skills: string[];
  trust_score: number;
  avatar_url: string;
  is_verified: boolean;
  created_at: string;
}

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  earned_at: string;
}

interface Endorsement {
  id: string;
  endorser_id: string;
  skill: string;
  message: string;
  created_at: string;
  endorser?: {
    full_name: string;
    college: string;
  };
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isProfileComplete } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [endorsementCounts, setEndorsementCounts] = useState<Record<string, number>>({});
  const [isMutualCollege, setIsMutualCollege] = useState(false);
  const [hasCollaborated, setHasCollaborated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndorseModal, setShowEndorseModal] = useState(false);

  const isOwnProfile = user?.id === userId;

  // Redirect to profile setup if viewing own profile and not complete
  useEffect(() => {
    if (isOwnProfile && !isProfileComplete) {
      navigate('/profile-setup');
    }
  }, [isOwnProfile, isProfileComplete, navigate]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchBadges();
      fetchEndorsements();
      if (user && !isOwnProfile) {
        checkMutualConnections();
      }
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      // Use public_profiles view for other users, profiles table for own profile
      if (isOwnProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } else {
        const { data, error } = await supabase
          .from('public_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Profile not found');
        // Cast to ProfileData without email for other users' profiles
        setProfile({ ...data, email: '' } as ProfileData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Profile not found',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBadges = async () => {
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId);
    setBadges(data || []);
  };

  const fetchEndorsements = async () => {
    const { data } = await supabase
      .from('endorsements')
      .select('*')
      .eq('endorsed_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(e => {
        counts[e.skill] = (counts[e.skill] || 0) + 1;
      });
      setEndorsementCounts(counts);

      const endorserIds = [...new Set(data.map(e => e.endorser_id))];
      if (endorserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('user_id, full_name, college')
          .in('user_id', endorserIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        const enriched = data.map(e => ({
          ...e,
          endorser: profileMap.get(e.endorser_id)
        }));
        setEndorsements(enriched);
      } else {
        setEndorsements([]);
      }
    }
  };

  const checkMutualConnections = async () => {
    if (!user || !userId) return;

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('college')
      .eq('user_id', user.id)
      .single();

    const { data: targetProfile } = await supabase
      .from('public_profiles')
      .select('college')
      .eq('user_id', userId)
      .maybeSingle();

    if (userProfile?.college && targetProfile?.college) {
      setIsMutualCollege(userProfile.college === targetProfile.college);
    }

    const { data: collabs } = await supabase
      .from('collaborations')
      .select('id')
      .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)
      .limit(1);

    setHasCollaborated((collabs?.length || 0) > 0);
  };

  const handleConnect = () => {
    navigate(`/messages?user=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </motion.div>

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="glass rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-trust opacity-5" />
            <div className="absolute inset-0 noise opacity-20" />
            
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative mx-auto sm:mx-0">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-trust flex items-center justify-center text-white text-4xl font-bold shadow-glow"
                >
                  {profile.full_name?.charAt(0) || '?'}
                </motion.div>
                {profile.is_verified && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{profile.full_name || 'Anonymous'}</h1>
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-trust/10 border border-primary/20 text-primary font-semibold"
                  >
                    <Star className="w-4 h-4 fill-primary" />
                    {profile.trust_score || 0}
                  </motion.span>
                </div>

                {profile.trust_intro && (
                  <p className="text-primary italic mb-3 text-lg">"{profile.trust_intro}"</p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted-foreground mb-4">
                  {profile.college && (
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      {profile.college}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Trust Indicators */}
                {!isOwnProfile && (
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {isMutualCollege && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm flex items-center gap-1.5 font-medium"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Same College
                      </motion.span>
                    )}
                    {hasCollaborated && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-sm flex items-center gap-1.5 font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Collaborated Before
                      </motion.span>
                    )}
                    {profile.is_verified && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-1.5 font-medium"
                      >
                        <Shield className="w-4 h-4" />
                        Verified
                      </motion.span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-end">
                {isOwnProfile ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="outline" onClick={() => navigate('/profile-setup')} className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="trust" onClick={() => setShowEndorseModal(true)} className="gap-2">
                        <ThumbsUp className="w-4 h-4" />
                        Endorse
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button variant="hero" onClick={handleConnect} className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Connect
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative mt-6 pt-6 border-t border-border/50"
              >
                <h3 className="font-semibold mb-2 text-lg">About</h3>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </motion.div>
            )}
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills with Endorsements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Skills
              </h3>
              
              {profile.skills && profile.skills.length > 0 ? (
                <div className="space-y-3">
                  {profile.skills.map((skill, idx) => (
                    <motion.div 
                      key={skill}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{skill}</span>
                      {endorsementCounts[skill] && (
                        <span className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {endorsementCounts[skill]}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No skills added yet</p>
              )}
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-amber-500" />
                Badges
              </h3>
              
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {badges.map((badge, idx) => (
                    <motion.div 
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-4 bg-gradient-trust/5 rounded-xl text-center border border-primary/10 hover:border-primary/30 transition-colors"
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-trust flex items-center justify-center shadow-glow">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-sm">{badge.badge_name}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                </div>
              )}
            </motion.div>

            {/* Recent Endorsements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 md:col-span-2"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                <ThumbsUp className="w-5 h-5 text-emerald-500" />
                Recent Endorsements
              </h3>
              
              {endorsements.length > 0 ? (
                <div className="space-y-4">
                  {endorsements.slice(0, 5).map((endorsement, idx) => (
                    <motion.div 
                      key={endorsement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <Link to={`/profile/${endorsement.endorser_id}`}>
                        <div className="w-10 h-10 rounded-lg bg-gradient-trust flex items-center justify-center text-white font-semibold hover:scale-105 transition-transform">
                          {endorsement.endorser?.full_name?.charAt(0) || '?'}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link to={`/profile/${endorsement.endorser_id}`} className="font-medium hover:text-primary transition-colors">
                            {endorsement.endorser?.full_name || 'Someone'}
                          </Link>
                          <span className="text-muted-foreground text-sm">endorsed</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{endorsement.skill}</span>
                        </div>
                        {endorsement.message && (
                          <p className="text-sm text-muted-foreground italic">"{endorsement.message}"</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ThumbsUp className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">No endorsements yet</p>
                  {!isOwnProfile && (
                    <Button variant="trust" size="sm" onClick={() => setShowEndorseModal(true)} className="mt-4">
                      Be the first to endorse
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {profile && (
        <EndorseModal
          open={showEndorseModal}
          onOpenChange={setShowEndorseModal}
          targetUserId={userId!}
          targetUserName={profile.full_name || 'this user'}
          skills={profile.skills || []}
          onEndorsed={fetchEndorsements}
        />
      )}
    </div>
  );
}