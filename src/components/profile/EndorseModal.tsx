import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EndorseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  skills: string[];
  onEndorsed: () => void;
}

export const EndorseModal = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  skills,
  onEndorsed
}: EndorseModalProps) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleEndorse = async () => {
    if (!user || !selectedSkill) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('endorsements').insert({
        endorser_id: user.id,
        endorsed_id: targetUserId,
        skill: selectedSkill,
        message: message.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already endorsed',
            description: `You've already endorsed ${targetUserName} for ${selectedSkill}`,
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Endorsement sent!',
          description: `You endorsed ${targetUserName} for ${selectedSkill}`,
        });
        
        setSelectedSkill('');
        setMessage('');
        onOpenChange(false);
        onEndorsed();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send endorsement',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-500" />
            Endorse {targetUserName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Select a skill to endorse:
            </p>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <motion.button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedSkill === skill
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-muted hover:bg-muted/80 hover:shadow-sm'
                    }`}
                  >
                    {skill}
                  </motion.button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills to endorse</p>
              )}
            </div>
          </div>

          {selectedSkill && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-sm font-medium">Add a message (optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Why do you endorse ${targetUserName} for ${selectedSkill}?`}
                className="min-h-[80px] rounded-xl resize-none"
                maxLength={200}
              />
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: !selectedSkill || isLoading ? 1 : 1.02 }}
            whileTap={{ scale: !selectedSkill || isLoading ? 1 : 0.98 }}
          >
            <Button
              variant="hero"
              className="w-full"
              onClick={handleEndorse}
              disabled={!selectedSkill || isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Send Endorsement
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
