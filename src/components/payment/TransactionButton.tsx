import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionFlow } from './TransactionFlow';
import { IndianRupee, Shield, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TransactionButtonProps {
  sellerId: string;
  sellerName: string;
  buyerId?: string; // Card poster (person who created the post)
  amount: number;
  postId?: string;
  workDescription?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onComplete?: (transactionId: string) => void;
}

export const TransactionButton = ({
  sellerId,
  sellerName,
  buyerId,
  amount,
  postId,
  workDescription,
  variant = 'default',
  size = 'default',
  onComplete,
}: TransactionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open if amount is provided (for buyer initiating payment)
  // OR if we detect an existing transaction for the seller (they need to upload work)
  useEffect(() => {
    if (amount > 0) {
      setIsOpen(true);
    } else if (amount === 0 && buyerId && sellerId) {
      // Check if there's an existing transaction where seller needs to upload work
      const checkExistingTransaction = async () => {
        try {
          const { data } = await supabase
            .from('transactions')
            .select('id, status')
            .eq('seller_id', sellerId)
            .eq('buyer_id', buyerId)
            .in('status', ['paid', 'work_in_progress'])
            .limit(1)
            .maybeSingle();
          
          if (data) {
            // There's a transaction waiting for work upload - auto-open for seller
            setIsOpen(true);
          }
        } catch (err) {
          // Table doesn't exist, ignore
        }
      };
      checkExistingTransaction();
    }
  }, [amount, buyerId, sellerId]);

  // Determine button text based on role and amount
  const getButtonText = () => {
    if (amount === 0 && buyerId && sellerId) {
      // Seller viewing existing transaction
      return 'View Transaction / Upload Work';
    }
    return 'Start Secure Transaction';
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className="gap-2"
      >
        <Shield className="w-4 h-4" />
        {amount === 0 ? (
          <Upload className="w-4 h-4" />
        ) : (
          <IndianRupee className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{getButtonText()}</span>
        <span className="sm:hidden">{amount === 0 ? 'Upload' : 'Pay'}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Secure Payment Transaction</DialogTitle>
          </DialogHeader>
          <TransactionFlow
            postId={postId}
            sellerId={sellerId}
            sellerName={sellerName}
            buyerId={buyerId}
            amount={amount}
            workDescription={workDescription}
            onComplete={(transactionId) => {
              setIsOpen(false);
              if (onComplete) {
                onComplete();
              }
              // Handle transaction completion
              console.log('Transaction completed:', transactionId);
            }}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
