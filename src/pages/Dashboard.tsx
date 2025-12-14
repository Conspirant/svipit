import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, HandHeart, HelpCircle, GraduationCap, Zap, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/dashboard/PostCard';
import { CreatePostModal } from '@/components/dashboard/CreatePostModal';
import { TopHelpers } from '@/components/dashboard/TopHelpers';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type FilterType = 'all' | 'college' | 'skill';
type PostType = 'all' | 'request' | 'offer';

interface Post {
  id: string;
  user_id: string;
  type: 'request' | 'offer';
  title: string;
  description: string;
  category: string;
  skills: string[];
  created_at: string;
  profile?: {
    full_name: string;
    college: string;
    trust_score: number;
    avatar_url: string;
    trust_intro: string;
  };
  hasApproached?: boolean;
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [postType, setPostType] = useState<PostType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [myPostsWithMessages, setMyPostsWithMessages] = useState<Set<string>>(new Set());

  const { user, loading, isProfileComplete, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isProfileComplete) {
      navigate('/profile-setup');
    }
  }, [user, loading, isProfileComplete, navigate]);

  useEffect(() => {
    if (user && isProfileComplete) {
      fetchPosts();
      fetchUserProfile();
      fetchMyPostsWithApproaches();
    }
  }, [user, filterType, postType, isProfileComplete]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setUserProfile(data);
  };

  const fetchMyPostsWithApproaches = async () => {
    if (!user) return;

    // Get my posts
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id);

    if (!myPosts?.length) return;

    // Check which posts have conversations where someone approached me
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, participant_1, participant_2')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    if (conversations?.length) {
      // For simplicity, mark all my posts as having potential messages
      // In a real app, you'd want to track which post led to which conversation
      const postsWithMessages = new Set<string>(myPosts.map(p => p.id));
      setMyPostsWithMessages(postsWithMessages);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('id, user_id, type, title, description, category, skills, created_at, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to reduce database load

      if (postType !== 'all') {
        query = query.eq('type', postType);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('user_id, full_name, college, trust_score, avatar_url, trust_intro')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));

      let enrichedPosts = postsData?.map(post => ({
        ...post,
        type: post.type as 'request' | 'offer',
        profile: profilesMap.get(post.user_id)
      })) || [];

      if (filterType === 'college' && userProfile?.college) {
        enrichedPosts = enrichedPosts.filter(p => p.profile?.college === userProfile.college);
      }

      if (filterType === 'skill' && userProfile?.skills?.length) {
        enrichedPosts = enrichedPosts.filter(p =>
          p.skills?.some(s => userProfile.skills.includes(s))
        );
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        enrichedPosts = enrichedPosts.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.skills?.some(s => s.toLowerCase().includes(query))
        );
      }

      setPosts(enrichedPosts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (user && isProfileComplete) fetchPosts();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  if (loading || !isProfileComplete) {
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

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      <div className="pt-20 md:pt-24 pb-6 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-1 md:mb-2">
              Welcome, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Friend'}</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg">Find someone who gets it.</p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-5 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search & Create */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
                className="glass rounded-2xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors duration-300" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search requests, offers, or skills..."
                      className="pl-12 h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/30 transition-all duration-300"
                    />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="hero"
                      onClick={() => setShowCreateModal(true)}
                      className="h-12 gap-2"
                    >
                      <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                      <span className="hidden sm:inline">Create Post</span>
                      <span className="sm:hidden">Create</span>
                    </Button>
                  </motion.div>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Post Type Filters */}
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'All', icon: Zap },
                      { value: 'request', label: 'Requests', icon: HelpCircle },
                      { value: 'offer', label: 'Offers', icon: HandHeart },
                    ].map(({ value, label, icon: Icon }) => (
                      <motion.button
                        key={value}
                        onClick={() => setPostType(value as PostType)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-300 ${postType === value
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <Icon className="w-4 h-4 transition-transform duration-300" />
                        <span className="hidden sm:inline">{label}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="hidden sm:block h-8 w-px bg-border/50 mx-1" />

                  {/* Scope Filters */}
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Everyone', icon: Users },
                      { value: 'college', label: 'My College', icon: GraduationCap },
                      { value: 'skill', label: 'My Skills', icon: Sparkles },
                    ].map(({ value, label, icon: Icon }) => (
                      <motion.button
                        key={value}
                        onClick={() => setFilterType(value as FilterType)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-300 ${filterType === value
                          ? 'bg-accent text-accent-foreground shadow-md'
                          : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <Icon className="w-4 h-4 transition-transform duration-300" />
                        <span className="hidden sm:inline">{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Posts */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <motion.div
                        key={`skeleton-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass rounded-2xl p-6 h-44 animate-pulse"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted" />
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                            <div className="h-5 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-full" />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : posts.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className="glass rounded-2xl p-12 text-center"
                    >
                      <motion.div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-trust/10 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-10 h-10 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Be the first to create a post and start connecting with your community!
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button variant="hero" size="lg" onClick={() => setShowCreateModal(true)} className="gap-2">
                          <Plus className="w-5 h-5" />
                          Create Your First Post
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    posts.map((post, index) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        index={index}
                        currentUserId={user?.id}
                        isOwnPost={post.user_id === user?.id}
                        hasApproaches={myPostsWithMessages.has(post.id)}
                        onConnect={() => navigate(`/messages?user=${post.user_id}`)}
                        onViewMessages={() => navigate('/messages')}
                        onDelete={post.user_id === user?.id ? async () => {
                          try {
                            const { error } = await supabase
                              .from('posts')
                              .delete()
                              .eq('id', post.id)
                              .eq('user_id', user?.id);

                            if (error) throw error;

                            // Remove from local state to update UI immediately
                            setPosts(prev => prev.filter(p => p.id !== post.id));

                            toast({
                              title: 'Post Deleted',
                              description: 'Your post has been successfully deleted.',
                            });
                          } catch (err) {
                            console.error('Error deleting post:', err);
                            toast({
                              title: 'Error',
                              description: 'Failed to delete post. Please try again.',
                              variant: 'destructive',
                            });
                          }
                        } : undefined}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar - Hidden on mobile, shown in a different layout */}
            <div className="hidden lg:block space-y-6">
              {/* Quick Stats */}
              <QuickStats />

              {/* Top Helpers */}
              <TopHelpers />

              {/* Trust Score Card */}
              {userProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-strong rounded-2xl p-5"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Your Progress
                  </h3>
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-14 h-14 rounded-xl bg-gradient-trust flex items-center justify-center shadow-trust"
                    >
                      <span className="text-xl font-bold text-white">{userProfile.trust_score || 0}</span>
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Trust Score</p>
                      <p className="text-xs text-muted-foreground">Help others to grow!</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Progress to next level</span>
                      <span className="font-medium">{Math.min((userProfile.trust_score || 0) % 100, 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((userProfile.trust_score || 0) % 100, 100)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full bg-gradient-trust rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreatePostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPostCreated={fetchPosts}
      />
    </div>
  );
}