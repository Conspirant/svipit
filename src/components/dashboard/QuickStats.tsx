import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, HandHeart, HelpCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const QuickStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOffers: 0,
    totalRequests: 0,
    myConnections: 0
  });

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: offersCount },
        { count: requestsCount },
        { count: connectionsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('type', 'offer').eq('is_active', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('type', 'request').eq('is_active', true),
        user 
          ? supabase.from('conversations').select('*', { count: 'exact', head: true }).or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
          : { count: 0 }
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalOffers: offersCount || 0,
        totalRequests: requestsCount || 0,
        myConnections: connectionsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statItems = [
    { label: 'Community', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Offers', value: stats.totalOffers, icon: HandHeart, color: 'text-emerald-500' },
    { label: 'Requests', value: stats.totalRequests, icon: HelpCircle, color: 'text-amber-500' },
    { label: 'Connections', value: stats.myConnections, icon: MessageCircle, color: 'text-primary' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
      className="glass rounded-2xl p-4 hover:shadow-md transition-shadow duration-300"
    >
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + idx * 0.05, type: "spring", stiffness: 200, damping: 15 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="p-3 rounded-xl bg-muted/30 text-center hover:bg-muted/50 transition-colors duration-300 cursor-default"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
            </motion.div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};