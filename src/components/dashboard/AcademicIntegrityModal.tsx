import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

const PROHIBITED_EXAMPLES = [
    {
        title: 'Direct Assignment Completion',
        example: '"Write my full DBMS assignment and submit it for me."',
        reason: 'Violates academic integrity.',
    },
    {
        title: 'Exam or Test Assistance',
        example: '"I have an online test at 2 PM, need someone to help me answer live."',
        reason: 'Unethical and strictly prohibited.',
    },
    {
        title: 'Plagiarism-Based Work',
        example: '"Copy answers from previous year records and reword them."',
        reason: 'Promotes academic dishonesty.',
    },
    {
        title: 'Impersonation',
        example: '"Log in using my credentials and upload the assignment."',
        reason: 'Violates institutional rules.',
    },
    {
        title: 'Answer Selling',
        example: '"Selling internal exam question paper solutions."',
        reason: 'Unfair academic advantage.',
    },
];

const ALLOWED_EXAMPLES = [
    'Guidance and doubt clarification',
    'Formatting and presentation help',
    'Feedback and review',
    'Skill-based services (design, editing, tutoring)',
    'Practice problem explanation (not graded)',
];

interface AcademicIntegrityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAccept: () => void;
}

export const AcademicIntegrityModal = ({ open, onOpenChange, onAccept }: AcademicIntegrityModalProps) => {
    const [agreed, setAgreed] = useState(false);

    const handleAccept = () => {
        if (agreed) {
            setAgreed(false);
            onAccept();
        }
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setAgreed(false);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 flex flex-col overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 text-center flex-shrink-0">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto mb-2 p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20"
                    >
                        <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
                    </motion.div>
                    <DialogTitle className="text-base sm:text-lg">Academic Integrity Guidelines</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Please read and accept before posting
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-3 space-y-3">
                    {/* Prohibited Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-500">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-semibold">NOT Allowed</span>
                        </div>
                        <div className="space-y-1.5">
                            {PROHIBITED_EXAMPLES.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="p-2 sm:p-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-red-500 text-xs">❌</span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                                {item.title}
                                            </span>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground italic mt-0.5 break-words">
                                                {item.example}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Allowed Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-semibold">What's Allowed</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <ul className="space-y-1">
                                {ALLOWED_EXAMPLES.map((item, index) => (
                                    <li key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                                        <span className="text-emerald-500">✓</span>
                                        <span className="text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Warning */}
                    <p className="text-[10px] sm:text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                        ⚠️ Violations will result in post removal and possible account suspension.
                    </p>
                </div>

                {/* Sticky Footer */}
                <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background/95 backdrop-blur-sm space-y-3">
                    {/* Agreement Checkbox */}
                    <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-primary/30 bg-primary/5">
                        <Checkbox
                            id="agreement"
                            checked={agreed}
                            onCheckedChange={(checked) => setAgreed(checked === true)}
                            className="mt-0.5"
                        />
                        <label
                            htmlFor="agreement"
                            className="text-xs sm:text-sm cursor-pointer select-none leading-tight"
                        >
                            I have read and agree to follow the Academic Integrity Guidelines.
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-10 sm:h-11 text-sm"
                            onClick={() => handleClose(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="hero"
                            className="flex-1 h-10 sm:h-11 text-sm gap-1.5"
                            disabled={!agreed}
                            onClick={handleAccept}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">I Accept & Continue</span>
                            <span className="sm:hidden">Accept</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
