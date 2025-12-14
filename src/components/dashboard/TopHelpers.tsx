import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TopHelper {
  user_id: string;
  full_name: string;
  college: string;
  trust_score: number;
  avatar_url: string;
}

export const TopHelpers = () => {
  const [helpers, setHelpers] = useState<TopHelper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopHelpers();
  }, []);

  const fetchTopHelpers = async () => {
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('user_id, full_name, college, trust_score, avatar_url')
        .order('trust_score', { ascending: false })
        .limit(5);

      setHelpers((data || []) as TopHelper[]);
    } catch (error) {
      console.error('Error fetching top helpers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="glass rounded-2xl p-6 hover:shadow-md transition-shadow duration-300"
    >
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Trophy className="w-5 h-5 text-amber-500" />
        </motion.div>
        Top Helpers This Week
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i} 
              className="h-12 bg-muted/50 rounded-xl animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>
      ) : helpers.length === 0 ? (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center py-4"
        >
          No helpers yet. Be the first!
        </motion.p>
      ) : (
        <div className="space-y-3">
          {helpers.map((helper, index) => (
            <motion.div
              key={helper.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/profile/${helper.user_id}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all duration-300 hover:shadow-sm group"
              >
              <motion.span 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform duration-300 group-hover:scale-110 ${
                  index === 0 ? 'bg-amber-500 text-white shadow-md' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-muted text-muted-foreground'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {index + 1}
              </motion.span>
              
              <motion.div 
                className="w-10 h-10 rounded-lg bg-gradient-trust flex items-center justify-center text-white font-semibold shadow-glow transition-transform duration-300 group-hover:scale-110"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                {helper.full_name?.charAt(0) || '?'}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{helper.full_name || 'Anonymous'}</p>
                {helper.college && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <GraduationCap className="w-3 h-3" />
                    {helper.college}
                  </p>
                )}
              </div>

              <motion.span 
                className="flex items-center gap-1 text-xs font-medium text-primary"
                whileHover={{ scale: 1.1 }}
              >
                <Star className="w-3 h-3 fill-primary" />
                {helper.trust_score || 0}
              </motion.span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
