import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(100);

// Bengaluru college email domains for verification
const BENGALURU_COLLEGES: Record<string, string> = {
  '@rvce.edu.in': 'RV College of Engineering',
  '@pes.edu': 'PES University',
  '@pesu.pes.edu': 'PES University',
  '@msrit.edu': 'MS Ramaiah Institute of Technology',
  '@bmsce.ac.in': 'BMS College of Engineering',
  '@sjce.ac.in': 'Sri Jayachamarajendra College of Engineering',
  '@dsce.edu.in': 'Dayananda Sagar College of Engineering',
  '@cmrit.ac.in': 'CMR Institute of Technology',
  '@nie.ac.in': 'The National Institute of Engineering',
  '@christ.edu.in': 'Christ University',
  '@jainuniversity.ac.in': 'Jain University',
  '@rnsit.ac.in': 'RNS Institute of Technology',
  '@nmit.ac.in': 'Nitte Meenakshi Institute of Technology',
  '@sap.edu.in': 'School of Architecture & Planning',
  '@iimb.ac.in': 'IIM Bangalore',
  '@iisc.ac.in': 'Indian Institute of Science',
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/profile-setup');
    }
  }, [user, navigate]);

  const getCollegeFromEmail = (email: string): { domain: string; name: string } | null => {
    const lowerEmail = email.toLowerCase();
    for (const [domain, name] of Object.entries(BENGALURU_COLLEGES)) {
      if (lowerEmail.endsWith(domain)) {
        return { domain, name };
      }
    }
    return null;
  };

  const isCollegeEmail = (email: string) => getCollegeFromEmail(email) !== null;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message === 'Invalid login credentials'
              ? 'Invalid email or password. Please try again.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Successfully logged in.',
          });
        }
      } else {
        const collegeInfo = getCollegeFromEmail(email);
        const { error } = await signUp(email, password, fullName);

        if (error) {
          if (error.message?.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Try logging in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          // If college email, update the profile with verification
          if (collegeInfo) {
            // Wait a moment for the profile to be created by the trigger
            setTimeout(async () => {
              const { data: { user: newUser } } = await supabase.auth.getUser();
              if (newUser) {
                await supabase
                  .from('profiles')
                  .update({
                    is_verified: true,
                    college: collegeInfo.name,
                    college_domain: collegeInfo.domain,
                  })
                  .eq('user_id', newUser.id);
              }
            }, 1000);

            toast({
              title: '🎓 College Verified!',
              description: `Welcome from ${collegeInfo.name}! Your profile is now verified.`,
            });
          } else {
            toast({
              title: 'Welcome to S.v.i.p!',
              description: 'Account created! Use a college email for instant verification.',
            });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const detectedCollege = getCollegeFromEmail(email);

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex items-center justify-center px-5 py-8">
      {/* Premium background */}
      <div className="absolute inset-0 gradient-mesh" />

      {/* Animated orbs - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/15 rounded-full blur-[80px] md:blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-accent/15 rounded-full blur-[80px] md:blur-[120px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center mb-8 md:mb-10 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img src="/logo.png" alt="S.V.I.P Logo" className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl mix-blend-multiply" />
          </motion.div>
          <p className="text-muted-foreground mt-1.5 md:mt-2 text-xs md:text-sm">Skill Value Interaction Platform</p>
        </Link>

        {/* Auth Card */}
        <motion.div
          className="glass-strong rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-premium"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          {/* Toggle */}
          <div className="flex bg-secondary/60 rounded-xl md:rounded-2xl p-1 md:p-1.5 mb-6 md:mb-8">
            <motion.button
              onClick={() => setIsLogin(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 md:py-3.5 rounded-lg md:rounded-xl font-semibold text-sm transition-all duration-300 ${isLogin
                ? 'bg-card shadow-elegant text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Log In
            </motion.button>
            <motion.button
              onClick={() => setIsLogin(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 md:py-3.5 rounded-lg md:rounded-xl font-semibold text-sm transition-all duration-300 ${!isLogin
                ? 'bg-card shadow-elegant text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Sign Up
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-12 h-13 rounded-xl border-border/50 bg-secondary/30 focus:bg-card transition-colors"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu.in"
                  className="pl-12 h-13 rounded-xl border-border/50 bg-secondary/30 focus:bg-card transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}

              <AnimatePresence mode="wait">
                {!isLogin && email && detectedCollege && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-trust/10 border border-trust/20"
                  >
                    <CheckCircle2 className="w-5 h-5 text-trust" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-trust">College Verified</p>
                      <p className="text-xs text-muted-foreground">{detectedCollege.name}</p>
                    </div>
                    <GraduationCap className="w-5 h-5 text-trust" />
                  </motion.div>
                )}
                {!isLogin && email && !detectedCollege && email.includes('@') && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Use a college email for instant verification
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 h-13 rounded-xl border-border/50 bg-secondary/30 focus:bg-card transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  {isLogin ? 'Log In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-semibold"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8 italic"
        >
          "Trust isn't built overnight — but here, it starts with your college ID."
        </motion.p>
      </motion.div>
    </div>
  );
}