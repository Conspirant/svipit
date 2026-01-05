import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, HandHeart, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Academic', 'Technical', 'Creative', 'Social', 'Sports', 'Other'
];

const SKILL_SUGGESTIONS = [
  'Coding', 'Design', 'Writing', 'Math', 'Photography', 'Music', 'Tutoring'
];

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export const CreatePostModal = ({ open, onOpenChange, onPostCreated }: CreatePostModalProps) => {
  const [type, setType] = useState<'request' | 'offer'>('request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim()) && skills.length < 5) {
      setSkills([...skills, skill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        skills,
      });

      if (error) throw error;

      toast({
        title: 'Post created!',
        description: 'Your post is now live.',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setSkills([]);
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Create a Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-4 sm:space-y-5">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <motion.button
                type="button"
                onClick={() => setType('request')}
                whileTap={{ scale: 0.98 }}
                className={`p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center gap-1 sm:gap-2 transition-all duration-300 ${type === 'request'
                  ? 'border-amber-500 bg-amber-500/10 shadow-md'
                  : 'border-border hover:border-amber-500/50 hover:bg-amber-500/5'
                  }`}
              >
                <HelpCircle className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${type === 'request' ? 'text-amber-500 scale-110' : 'text-muted-foreground'}`} />
                <span className={`text-sm sm:text-base font-medium transition-colors ${type === 'request' ? 'text-amber-600' : ''}`}>Request Help</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">I need assistance</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setType('offer')}
                whileTap={{ scale: 0.98 }}
                className={`p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center gap-1 sm:gap-2 transition-all duration-300 ${type === 'offer'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                  : 'border-border hover:border-emerald-500/50 hover:bg-emerald-500/5'
                  }`}
              >
                <HandHeart className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${type === 'offer' ? 'text-emerald-500 scale-110' : 'text-muted-foreground'}`} />
                <span className={`text-sm sm:text-base font-medium transition-colors ${type === 'offer' ? 'text-emerald-600' : ''}`}>Offer Help</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">I can help others</span>
              </motion.button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'request' ? "What do you need help with?" : "What can you help with?"}
                className="h-10 sm:h-11 rounded-xl text-sm sm:text-base"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                className="min-h-[70px] sm:min-h-[80px] rounded-xl resize-none text-sm sm:text-base"
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm">Category</Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(category === cat ? '' : cat)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all duration-300 ${category === cat
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80'
                      }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <Label className="text-sm">Related Skills</Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 5).map((skill) => (
                  <motion.button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    whileTap={{ scale: 0.95 }}
                    className="px-2.5 sm:px-3 py-1 rounded-full border border-dashed border-border text-xs sm:text-sm hover:border-primary hover:bg-primary/5 transition-all duration-300"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    {skill}
                  </motion.button>
                ))}
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/30 rounded-xl mt-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm flex items-center gap-1"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-primary/70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Submit Button */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background/95 backdrop-blur-sm">
            <motion.div
              whileTap={{ scale: isLoading || !title.trim() ? 1 : 0.98 }}
            >
              <Button
                type="submit"
                variant="hero"
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                disabled={isLoading || !title.trim()}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
