import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, X, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const COLLEGES = [
  'RV College of Engineering',
  'PES University',
  'MS Ramaiah Institute of Technology',
  'BMS College of Engineering',
  'SJCE Mysore',
  'Dayananda Sagar College of Engineering',
  'CMR Institute of Technology',
  'NIE Mysore',
  'Other',
];

const SKILL_SUGGESTIONS = [
  'Coding', 'Design', 'Photography', 'Writing', 'Music',
  'Tutoring', 'Video Editing', 'Public Speaking', 'Data Analysis',
  'Graphic Design', 'Web Development', 'Marketing', 'Research',
];

export default function ProfileSetup() {
  const [step, setStep] = useState(1);
  const [college, setCollege] = useState('');
  const [bio, setBio] = useState('');
  const [trustIntro, setTrustIntro] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, loading, refreshProfile, isProfileComplete } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && isProfileComplete) {
      // If profile is already complete, redirect to dashboard
      navigate('/dashboard');
    }
  }, [user, loading, isProfileComplete, navigate]);

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim()) && skills.length < 10) {
      setSkills([...skills, skill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          college,
          bio: bio.slice(0, 500),
          trust_intro: trustIntro.slice(0, 100),
          skills,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the profile in context so isProfileComplete updates
      await refreshProfile();

      toast({
        title: 'Profile complete!',
        description: 'Welcome to the S.v.i.p community.',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-primary/15 rounded-full blur-[80px] md:blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-accent/15 rounded-full blur-[80px] md:blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
      </div>

      <div className="relative z-10 container max-w-2xl mx-auto px-5 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
            <Shield className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-center">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-center text-sm md:text-base">Let others know who you are</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6 md:mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 md:h-2 rounded-full transition-all ${
                s === step ? 'w-8 md:w-10 bg-primary' : s < step ? 'w-8 md:w-10 bg-primary/50' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="glass-strong rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-elegant">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold">Where do you study?</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Connect with students from your college
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COLLEGES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCollege(c)}
                      className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        college === c
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep(2)}
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={!college}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold">What are your skills?</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Select or add skills you can offer to help others
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill)}
                      className="px-4 py-2 rounded-full border border-border/50 text-sm hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      {skill}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add custom skill"
                    className="h-12 rounded-xl"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                  />
                  <Button
                    onClick={() => addSkill(newSkill)}
                    variant="trust"
                    className="h-12 px-6"
                    disabled={!newSkill.trim()}
                  >
                    Add
                  </Button>
                </div>

                {skills.length > 0 && (
                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <Label className="text-sm text-muted-foreground">Your skills:</Label>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-2"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    disabled={skills.length === 0}
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold">Tell us about yourself</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Help others get to know you better
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your interests, what you're studying..."
                    className="min-h-[100px] rounded-xl border-border/50 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trustIntro" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Trust Intro
                  </Label>
                  <Input
                    id="trustIntro"
                    value={trustIntro}
                    onChange={(e) => setTrustIntro(e.target.value)}
                    placeholder='e.g., "Known for helping with assignments"'
                    className="h-12 rounded-xl border-border/50"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    A short tagline that appears on your profile ({trustIntro.length}/100)
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    disabled={isLoading || !bio.trim()}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        Complete Profile
                        <Check className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        {(college || skills.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mt-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Profile Preview</h3>
            <div className="space-y-2">
              {college && (
                <p className="text-sm">
                  <span className="text-muted-foreground">College:</span>{' '}
                  <span className="font-medium">{college}</span>
                </p>
              )}
              {skills.length > 0 && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Skills:</span>{' '}
                  <span className="font-medium">{skills.join(', ')}</span>
                </p>
              )}
              {trustIntro && (
                <p className="text-sm italic text-primary">"{trustIntro}"</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
