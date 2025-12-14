import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, GraduationCap, Check, Shield, MessageCircle, Star, Search, IndianRupee, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TransactionButton } from '@/components/payment/TransactionButton';
import { validateMessage, sanitizeMessage, checkRateLimit, containsPaymentContent, extractUpiId } from '@/utils/chatSecurity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  other_user?: {
    user_id: string;
    full_name: string;
    college: string;
    trust_score: number;
    avatar_url: string;
  };
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_flagged?: boolean;
  flag_reason?: string;
  contains_links?: boolean;
  link_count?: number;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trustIndicators, setTrustIndicators] = useState<{ mutual: boolean; collaborated: boolean; verified: boolean }>({
    mutual: false,
    collaborated: false,
    verified: false
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [messageWarning, setMessageWarning] = useState<string | null>(null);
  const [isUserBuyer, setIsUserBuyer] = useState<boolean | null | undefined>(undefined); // undefined = unknown (don't show), true = buyer, false = seller, null = not checked yet

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, loading, isProfileComplete } = useAuth();
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
      fetchConversations();
    }
  }, [user, isProfileComplete]);

  useEffect(() => {
    if (targetUserId && user && conversations.length > 0) {
      findOrCreateConversation(targetUserId);
    } else if (targetUserId && user) {
      // If no conversations loaded yet, try to create/find after fetch
      const timer = setTimeout(() => {
        if (user) findOrCreateConversation(targetUserId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [targetUserId, user, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      fetchTrustIndicators();
      // Check if blocked (with error handling)
      checkIfBlocked().catch(err => {
        console.warn('Could not check block status:', err);
      });
      // Check user role (buyer or seller)
      checkUserRole().catch(err => {
        console.warn('Could not check user role:', err);
      });
      inputRef.current?.focus();

      // Subscribe to messages
      const messageChannel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      // Subscribe to transactions updates
      const transactionChannel = supabase
        .channel(`transactions-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions'
          },
          (payload) => {
            // Refresh role check when any transaction change occurs involving these users
            const newTxn = payload.new as any;
            if (newTxn && (
              (newTxn.buyer_id === user?.id && newTxn.seller_id === selectedConversation.other_user?.user_id) ||
              (newTxn.seller_id === user?.id && newTxn.buyer_id === selectedConversation.other_user?.user_id)
            )) {
              console.log('Transaction update detected, refreshing role...', payload.eventType);
              checkUserRole();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(transactionChannel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const otherUserIds = data?.map(c =>
        c.participant_1 === user.id ? c.participant_2 : c.participant_1
      ) || [];

      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('user_id, full_name, college, trust_score, avatar_url')
          .in('user_id', otherUserIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

        const enriched = data?.map(c => ({
          ...c,
          other_user: profileMap.get(c.participant_1 === user.id ? c.participant_2 : c.participant_1)
        })) || [];

        setConversations(enriched);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const findOrCreateConversation = async (otherUserId: string) => {
    if (!user || otherUserId === user.id) return;

    const existing = conversations.find(c =>
      c.other_user?.user_id === otherUserId
    );

    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('conversations')
            .select('*')
            .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
            .single();

          if (existing) {
            const { data: profile } = await supabase
              .from('public_profiles')
              .select('user_id, full_name, college, trust_score, avatar_url')
              .eq('user_id', otherUserId)
              .maybeSingle();

            setSelectedConversation({
              ...existing,
              other_user: profile
            });
          }
        } else {
          throw error;
        }
      } else {
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('user_id, full_name, college, trust_score, avatar_url')
          .eq('user_id', otherUserId)
          .maybeSingle();

        const newConv = { ...data, other_user: profile };
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConversation.id)
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(data || []);

      if (user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', selectedConversation.id)
          .neq('sender_id', user.id);
      }
    }
  };

  const fetchTrustIndicators = async () => {
    if (!user || !selectedConversation?.other_user) return;

    const otherUserId = selectedConversation.other_user.user_id;

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('college')
      .eq('user_id', user.id)
      .single();

    const mutual = myProfile?.college === selectedConversation.other_user.college;

    const { data: collabs } = await supabase
      .from('collaborations')
      .select('id')
      .or(`and(user_1.eq.${user.id},user_2.eq.${otherUserId}),and(user_1.eq.${otherUserId},user_2.eq.${user.id})`)
      .limit(1);

    const verified = (selectedConversation.other_user.trust_score || 0) >= 50;

    setTrustIndicators({
      mutual,
      collaborated: (collabs?.length || 0) > 0,
      verified
    });
  };

  // Check if current user is buyer (card poster) or seller (helper) for any active transaction
  const checkUserRole = async () => {
    if (!user || !selectedConversation?.other_user) {
      setIsUserBuyer(undefined);
      return;
    }

    try {
      // 1. First look for ACTIVE transactions (where work is ongoing/payment pending)
      // This prioritizes current active flows over old completed ones
      const { data: activeTransaction, error: activeError } = await supabase
        .from('transactions')
        .select('id, buyer_id, seller_id, status')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${selectedConversation.other_user.user_id}),and(seller_id.eq.${user.id},buyer_id.eq.${selectedConversation.other_user.user_id})`)
        .in('status', ['pending', 'payment_pending', 'paid', 'work_in_progress', 'work_submitted', 'disputed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeTransaction) {
        if (activeTransaction.buyer_id === user.id) {
          setIsUserBuyer(true); // Current user is buyer
          console.log('Active transaction found: User is BUYER');
        } else {
          setIsUserBuyer(false); // Current user is seller
          console.log('Active transaction found: User is SELLER');
        }
        return;
      }

      // 2. If no active transaction, check if there are completed transactions
      // For completed transactions, allow the BUYER to start a new one (roles stay same based on conversation)
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('id, buyer_id, seller_id, status')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${selectedConversation.other_user.user_id}),and(seller_id.eq.${user.id},buyer_id.eq.${selectedConversation.other_user.user_id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If table doesn't exist, error will be set
      if (error && (error.code === 'PGRST116' || error.message?.includes('404'))) {
        console.log('Transactions table not found - hiding payment buttons');
        setIsUserBuyer(undefined);
        return;
      }

      if (transaction) {
        // Check if the most recent transaction is COMPLETED (approved, released, cancelled, refunded)
        const isCompleted = ['approved', 'released', 'cancelled', 'refunded'].includes(transaction.status);

        if (isCompleted) {
          // Transaction is completed - allow starting a new one!
          // Use the SAME buyer from the previous transaction (they're usually the one who needs work done)
          console.log('Previous transaction completed - allowing new transaction initiation');

          if ((transaction as any).buyer_id === user.id) {
            // User was the buyer in the last transaction - they can start new transactions
            setIsUserBuyer(true);
            console.log('Completed transaction: User was BUYER - can start new transaction');
          } else {
            // User was the seller in the last transaction - wait for buyer to start new one
            setIsUserBuyer(false);
            console.log('Completed transaction: User was SELLER - wait for new transaction');
          }
          return;
        }

        // Transaction is NOT completed (still in some other state) - use existing roles
        if ((transaction as any).buyer_id === user.id) {
          setIsUserBuyer(true);
          console.log('Recent transaction found: User is BUYER');
        } else if ((transaction as any).seller_id === user.id) {
          setIsUserBuyer(false);
          console.log('Recent transaction found: User is SELLER');
        } else {
          setIsUserBuyer(null);
        }
        return;
      }

      // 3. No transaction exists - use conversation context to determine roles
      // participant_1 = person who initiated the conversation (clicked "Message" on a post) = HELPER/SELLER
      // participant_2 = post owner (person who posted asking for help) = BUYER
      if (selectedConversation.participant_1 && selectedConversation.participant_2) {
        if (user.id === selectedConversation.participant_2) {
          // Current user is participant_2 (post owner) = BUYER
          console.log('No transaction, but user is post owner (participant_2) = BUYER');
          setIsUserBuyer(true);
        } else if (user.id === selectedConversation.participant_1) {
          // Current user is participant_1 (helper who messaged) = SELLER
          console.log('No transaction, but user is helper (participant_1) = SELLER');
          setIsUserBuyer(false);
        } else {
          // Shouldn't happen, but fallback
          console.log('No transaction, unknown participant role');
          setIsUserBuyer(undefined);
        }
        return;
      }

      // Fallback if participant info not available
      console.log('No transaction and no participant info - hiding buttons');
      setIsUserBuyer(undefined);

    } catch (err) {
      console.warn('Error checking user role:', err);
      setIsUserBuyer(undefined);
    }
  };

  const checkIfBlocked = async () => {
    if (!user || !selectedConversation?.other_user) return;

    try {
      // Check if blocks table exists and query directly
      const { data, error } = await supabase
        .from('blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_user_id', selectedConversation.other_user.user_id)
        .maybeSingle();

      // If table doesn't exist (404), just ignore
      if (error && error.code === 'PGRST116') {
        setIsBlocked(false);
        return;
      }

      if (!error && data) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
    } catch (error: any) {
      // If blocks table doesn't exist yet (404), just set to false
      if (error?.code === 'PGRST116' || error?.message?.includes('404')) {
        setIsBlocked(false);
      } else {
        console.warn('Error checking block status:', error);
        setIsBlocked(false);
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    // Check if blocked
    if (isBlocked) {
      toast({
        title: 'Cannot Send Message',
        description: 'You have blocked this user. Unblock them to send messages.',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting
    const rateLimitCheck = checkRateLimit(lastMessageTime, 1000);
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Please Wait',
        description: `Please wait ${rateLimitCheck.waitTime} seconds before sending another message.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate message
    const validation = validateMessage(newMessage);
    if (!validation.valid) {
      toast({
        title: 'Message Blocked',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Show warning if present
    if (validation.warning) {
      setMessageWarning(validation.warning);
    }

    // Sanitize message
    const sanitized = sanitizeMessage(newMessage);

    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: sanitized,
      });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      setLastMessageTime(Date.now());
      setMessageWarning(null);

      // Check if message contains payment content and suggest secure transaction
      if (containsPaymentContent(sanitized)) {
        const upiId = extractUpiId(sanitized);
        if (upiId) {
          toast({
            title: 'Payment Detected',
            description: 'For secure payments, use our escrow system instead of sharing UPI IDs directly.',
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);

    // Real-time validation feedback
    if (value.trim()) {
      const validation = validateMessage(value);
      if (validation.warning) {
        setMessageWarning(validation.warning);
      } else {
        setMessageWarning(null);
      }
    } else {
      setMessageWarning(null);
    }
  };

  const filteredConversations = conversations.filter(c =>
    !searchQuery || c.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (loading) {
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

  // Redirect if not authenticated
  if (!user) {
    return null; // useEffect will handle navigation
  }

  // Redirect if profile not complete
  if (!isProfileComplete) {
    return null; // useEffect will handle navigation
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 h-screen flex">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-card/50 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="text-xl font-bold">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 h-10 rounded-xl bg-muted/30 border-0"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No conversations yet</p>
                <p className="text-sm text-muted-foreground">Connect with someone from the dashboard!</p>
                <Button variant="trust" size="sm" onClick={() => navigate('/dashboard')} className="mt-4">
                  Browse Community
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border/30 ${selectedConversation?.id === conv.id ? 'bg-primary/5' : ''
                    }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-trust flex items-center justify-center text-white font-bold shrink-0">
                    {conv.other_user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{conv.other_user?.full_name || 'Unknown'}</p>
                      {conv.other_user?.trust_score && conv.other_user.trust_score >= 50 && (
                        <Star className="w-3 h-3 text-primary fill-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.other_user?.college || 'Student'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                  </span>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border glass">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>

                  <Link to={`/profile/${selectedConversation.other_user?.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-11 h-11 rounded-xl bg-gradient-trust flex items-center justify-center text-white font-bold shadow-glow shrink-0"
                    >
                      {selectedConversation.other_user?.full_name?.charAt(0) || '?'}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{selectedConversation.other_user?.full_name || 'Unknown'}</p>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-primary" />
                          {selectedConversation.other_user?.trust_score || 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {trustIndicators.mutual && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            <span className="hidden sm:inline">Same College</span>
                          </span>
                        )}
                        {trustIndicators.collaborated && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span className="hidden sm:inline">Collaborated</span>
                          </span>
                        )}
                        {trustIndicators.verified && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span className="hidden sm:inline">Trusted</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Secure Transaction Button - Only for Card Poster (Buyer) */}
                  {/* NEVER show to seller (helper) */}
                  {selectedConversation.other_user && user && (
                    <>
                      {/* Show payment button ONLY if user is confirmed buyer (post owner) */}
                      {isUserBuyer === true && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowPaymentDialog(true);
                            }}
                            className="gap-2"
                            title="Start secure payment transaction"
                          >
                            <IndianRupee className="w-4 h-4" />
                            <Shield className="w-4 h-4" />
                            <span className="hidden sm:inline">Secure Payment</span>
                          </Button>
                        </div>
                      )}

                      {/* Show "View Transaction / Upload Work" button for Helper (Seller) */}
                      {isUserBuyer === false && (
                        <div className="flex items-center gap-2">
                          <TransactionButton
                            sellerId={user.id} // Current user is the seller (helper)
                            sellerName={user.user_metadata?.full_name || 'You'}
                            buyerId={selectedConversation.other_user.user_id} // Other user is the buyer (card poster)
                            amount={0} // Amount will be loaded from transaction
                          />
                        </div>
                      )}

                      {/* If role is unknown, DON'T show any button by default */}
                      {/* This prevents both users from seeing payment buttons when we can't determine roles */}
                      {/* Only show if user explicitly wants to initiate (they can use a different method) */}
                    </>
                  )}
                </div>

                {/* Blocked User Warning */}
                {isBlocked && (
                  <Alert className="mt-3 border-amber-500/20 bg-amber-500/10">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span>You have blocked this user. You will not receive messages from them.</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await supabase
                              .from('blocks')
                              .delete()
                              .eq('blocker_id', user?.id || '')
                              .eq('blocked_user_id', selectedConversation?.other_user?.user_id || '');
                            setIsBlocked(false);
                            toast({
                              title: 'User Unblocked',
                              description: 'You can now send and receive messages from this user.',
                            });
                          } catch (err) {
                            console.error('Error unblocking user:', err);
                          }
                        }}
                        className="ml-2 border-amber-500 text-amber-700 hover:bg-amber-500/20"
                      >
                        Unblock
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-trust/10 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-medium mb-1">Start the conversation!</p>
                    <p className="text-sm text-muted-foreground">Say hello to {selectedConversation.other_user?.full_name?.split(' ')[0] || 'them'}</p>
                  </div>
                )}
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.sender_id === user?.id}
                      onReport={() => {
                        toast({
                          title: 'Report Submitted',
                          description: 'Thank you for helping keep the community safe.',
                        });
                      }}
                      onBlock={() => {
                        setIsBlocked(true);
                        fetchConversations();
                      }}
                    />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-border glass">
                {messageWarning && (
                  <Alert className="mb-3 border-blue-500/20 bg-blue-500/10">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-400 text-xs">
                      {messageWarning}
                    </AlertDescription>
                  </Alert>
                )}

                {isBlocked && (
                  <Alert className="mb-3 border-red-500/20 bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-700 dark:text-red-400 text-xs">
                      You have blocked this user. Unblock them to send messages.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    placeholder={isBlocked ? "You have blocked this user" : "Type a message... (Use secure transaction for payments)"}
                    className="flex-1 h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/30 transition-all duration-300"
                    maxLength={1000}
                    disabled={isBlocked}
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="submit"
                      variant="hero"
                      size="icon"
                      className="h-12 w-12 rounded-xl shrink-0"
                      disabled={!newMessage.trim() || isSending}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/5">
              <div className="text-center max-w-sm px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-trust/10 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                <p className="text-muted-foreground mb-6">Select a conversation or connect with someone new from the community</p>
                <Button variant="trust" onClick={() => navigate('/dashboard')}>
                  Browse Community
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Amount Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Secure Transaction</DialogTitle>
            <DialogDescription>
              Enter the payment amount to start a secure escrow transaction. Your payment will be held safely until work is verified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
              />
            </div>

            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Your payment will be held in escrow until you approve the work. This protects both you and the seller.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (paymentAmount > 0 && selectedConversation?.other_user) {
                  setShowPaymentDialog(false);
                  // TransactionButton will handle the rest
                } else {
                  toast({
                    title: 'Invalid Amount',
                    description: 'Please enter a valid amount greater than 0',
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!paymentAmount || paymentAmount <= 0}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Flow (shown when amount is set) - Only for Card Poster (Buyer) */}
      {paymentAmount > 0 && selectedConversation?.other_user && user && isUserBuyer !== false && (
        <TransactionButton
          sellerId={selectedConversation.other_user.user_id}
          sellerName={selectedConversation.other_user.full_name || 'User'}
          buyerId={user.id} // Current user is the buyer (card poster) when they initiate payment
          amount={paymentAmount}
          onComplete={() => {
            setPaymentAmount(0);
            setIsUserBuyer(true); // Confirm user is buyer after transaction
            toast({
              title: 'Transaction Complete',
              description: 'Payment has been securely processed.',
            });
          }}
        />
      )}

      {/* Transaction Flow for Helper (Seller) - Show existing transaction if they're the seller */}
      {/* This will auto-load the transaction and show work upload interface if payment is verified */}
      {selectedConversation?.other_user && user && isUserBuyer === false && (
        <div className="hidden">
          {/* Hidden TransactionButton that loads transaction for seller */}
          <TransactionButton
            sellerId={user.id} // Current user is the seller (helper)
            sellerName={user.user_metadata?.full_name || 'You'}
            buyerId={selectedConversation.other_user.user_id} // Other user is the buyer (card poster)
            amount={0} // Amount will be loaded from transaction
          />
        </div>
      )}
    </div>
  );
}