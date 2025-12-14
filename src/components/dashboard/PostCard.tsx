import { motion } from 'framer-motion';
import { MessageCircle, GraduationCap, Clock, HandHeart, HelpCircle, Star, Mail, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
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
  };
  index: number;
  currentUserId?: string;
  isOwnPost?: boolean;
  hasApproaches?: boolean;
  onConnect: () => void;
  onViewMessages?: () => void;
  onDelete?: () => void;
}

export const PostCard = ({ post, index, currentUserId, isOwnPost, hasApproaches, onConnect, onViewMessages, onDelete }: PostCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar */}
        <Link to={`/profile/${post.user_id}`} className="shrink-0">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-trust flex items-center justify-center text-white font-bold text-lg shadow-glow cursor-pointer"
          >
            {post.profile?.full_name?.charAt(0) || '?'}
          </motion.div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* User Info Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link to={`/profile/${post.user_id}`} className="font-semibold hover:text-primary transition-colors">
              {post.profile?.full_name || 'Anonymous'}
            </Link>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-trust/10 border border-primary/20 text-primary font-medium"
            >
              <Star className="w-3 h-3 fill-primary" />
              {post.profile?.trust_score || 0}
            </motion.span>
            {post.profile?.college && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <GraduationCap className="w-3 h-3" />
                {post.profile.college}
              </span>
            )}
          </div>

          {/* Trust Intro */}
          {post.profile?.trust_intro && (
            <p className="text-xs text-muted-foreground italic mb-3 line-clamp-1">
              "{post.profile.trust_intro}"
            </p>
          )}

          {/* Post Type & Category */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${post.type === 'request'
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}>
              {post.type === 'request' ? <HelpCircle className="w-3.5 h-3.5" /> : <HandHeart className="w-3.5 h-3.5" />}
              {post.type === 'request' ? 'Need Help' : 'Offering Help'}
            </span>
            {post.category && (
              <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted/50 rounded-full">
                {post.category}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="font-semibold text-lg mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {post.description}
            </p>
          )}

          {/* Skills */}
          {post.skills && post.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-primary/5 text-primary text-xs font-medium border border-primary/10"
                >
                  {skill}
                </span>
              ))}
              {post.skills.length > 4 && (
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  +{post.skills.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Footer Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOwnPost ? (
                <>
                  {hasApproaches && (
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={onViewMessages}
                      className="gap-1.5"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">View Messages</span>
                      <span className="sm:hidden">Messages</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                          onDelete();
                        }
                      }}
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="trust"
                  size="sm"
                  onClick={onConnect}
                  className="gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};