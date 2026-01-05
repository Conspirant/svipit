import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Flag, Shield, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { extractUrls, isSuspiciousUrl } from '@/utils/chatSecurity';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageBubbleProps {
  message: {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_flagged?: boolean;
    flag_reason?: string;
    contains_links?: boolean;
  };
  isOwnMessage: boolean;
  onReport?: () => void;
  onBlock?: () => void;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble = ({ message, isOwnMessage, onReport, onBlock, onDelete }: MessageBubbleProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urls = extractUrls(message.content);
  const hasSuspiciousLinks = urls.some(url => isSuspiciousUrl(url));

  const handleReport = async () => {
    if (!user || !reportType || !reportReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: message.sender_id,
        message_id: message.id,
        report_type: reportType,
        reason: reportReason,
      });

      if (error) throw error;

      toast({
        title: 'Report Submitted',
        description: 'Thank you for reporting. Our team will review this.',
      });

      setShowReportDialog(false);
      setReportType('');
      setReportReason('');
      if (onReport) onReport();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_user_id: message.sender_id,
        reason: 'Blocked from chat',
      });

      if (error) throw error;

      toast({
        title: 'User Blocked',
        description: 'This user has been blocked. You will no longer receive messages from them.',
      });

      if (onBlock) onBlock();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block user',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
      >
        <div className="relative max-w-[80%] sm:max-w-[70%]">
          {/* Warning banner for suspicious messages */}
          {(message.is_flagged || hasSuspiciousLinks) && !isOwnMessage && (
            <div className="mb-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {message.is_flagged
                  ? `Warning: ${message.flag_reason || 'This message was flagged as suspicious'}`
                  : 'Warning: This message contains suspicious links. Be cautious!'}
              </span>
            </div>
          )}

          <div
            className={`p-3.5 rounded-2xl ${isOwnMessage
              ? 'bg-gradient-trust text-white rounded-br-md shadow-md'
              : 'bg-card border border-border rounded-bl-md'
              }`}
          >
            {/* Message content with link detection */}
            <div className="break-words">
              {message.content.split(/(https?:\/\/[^\s]+)/g).map((part, idx) => {
                if (part.match(/^https?:\/\//)) {
                  const isSuspicious = isSuspiciousUrl(part);
                  return (
                    <span key={idx} className="inline-flex items-center gap-1">
                      <a
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline ${isSuspicious
                          ? 'text-red-500 hover:text-red-600'
                          : isOwnMessage
                            ? 'text-white/90 hover:text-white'
                            : 'text-primary hover:text-primary/80'
                          }`}
                        onClick={(e) => {
                          if (isSuspicious) {
                            e.preventDefault();
                            toast({
                              title: 'Suspicious Link Blocked',
                              description: 'This link appears to be suspicious. Please verify before clicking.',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        {part}
                        <ExternalLink className="w-3 h-3 inline ml-1" />
                      </a>
                      {isSuspicious && (
                        <Shield className="w-3 h-3 text-red-500" />
                      )}
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </div>

            <div className={`flex items-center justify-between mt-1.5 text-xs ${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'
              }`}>
              <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>

              {!isOwnMessage && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <Flag className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleBlock}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Block
                  </Button>
                </div>
              )}

              {/* Delete button for own messages */}
              {isOwnMessage && onDelete && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(message.id)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting suspicious or inappropriate content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="scam">Scam / Fraud</SelectItem>
                  <SelectItem value="suspicious_payment">Suspicious Payment Request</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please provide more details about why you're reporting this message..."
                rows={4}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportType || !reportReason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
