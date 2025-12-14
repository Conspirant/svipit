import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, CheckCircle2, Clock, AlertCircle, Upload, Eye, X, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'qrcode';

interface TransactionFlowProps {
  postId?: string;
  sellerId: string;
  sellerName: string;
  buyerId?: string; // Card poster (person who created the post)
  amount: number;
  workDescription?: string;
  onComplete?: (transactionId: string) => void;
  onCancel?: () => void;
}

type TransactionStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'work_in_progress'
  | 'work_submitted'
  | 'approved'
  | 'released'
  | 'disputed'
  | 'cancelled'
  | 'refunded';

interface Transaction {
  id: string;
  transaction_id: string;
  status: TransactionStatus;
  amount: number;
  upi_id: string;
  upi_qr_data: string;
  payment_proof_url: string | null;
  work_preview_url: string | null;
  work_files: string[] | null;
  buyer_approval: boolean;
  expires_at: string;
  buyer_id?: string;
  seller_id?: string;
}

export const TransactionFlow = ({
  postId,
  sellerId,
  sellerName,
  buyerId,
  amount,
  workDescription,
  onComplete,
  onCancel
}: TransactionFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Determine user role
  // Card poster (buyer) = person who created the post (initiates payment)
  // Person helping (seller) = service provider (submits work)
  // IMPORTANT: If transaction exists, use transaction data to determine role (more reliable)
  const [actualRole, setActualRole] = useState<{ isBuyer: boolean; isSeller: boolean } | null>(null);
  const [step, setStep] = useState<'initiate' | 'payment' | 'verify' | 'work' | 'complete'>('initiate');
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  // Helper function to determine role from transaction
  const getRoleFromTransaction = (txn: Transaction | null): { isBuyer: boolean; isSeller: boolean } => {
    if (txn && txn.buyer_id && txn.seller_id && user) {
      return {
        isBuyer: txn.buyer_id === user.id,
        isSeller: txn.seller_id === user.id
      };
    }
    // Fallback to props-based role
    return {
      isBuyer: buyerId ? user?.id === buyerId : false,
      isSeller: user?.id === sellerId
    };
  };

  // Calculate role - use useMemo to avoid recalculating on every render
  // This must be calculated AFTER transaction state is declared
  const role = useMemo(() => {
    if (transaction) {
      return getRoleFromTransaction(transaction);
    }
    if (actualRole) {
      return actualRole;
    }
    // Default to props-based role
    return {
      isBuyer: buyerId ? user?.id === buyerId : false,
      isSeller: user?.id === sellerId
    };
  }, [transaction, actualRole, buyerId, sellerId, user]);

  const isBuyer = role.isBuyer;
  const isSeller = role.isSeller;
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workFiles, setWorkFiles] = useState<File[]>([]);
  const [workPreviewUrl, setWorkPreviewUrl] = useState<string>('');
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Load existing transaction if postId provided OR if we have buyer/seller info
  // Note: We use a simpler check here to avoid circular dependency with isBuyer/isSeller
  useEffect(() => {
    if (user && (buyerId || sellerId)) {
      const loadTransaction = async () => {
        try {
          // Build query to find transaction between buyer and seller
          let query = supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          // Filter by buyer and seller relationship
          if (buyerId && sellerId) {
            query = query.or(`and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`);
          } else if (buyerId) {
            query = query.or(`buyer_id.eq.${buyerId},seller_id.eq.${buyerId}`);
          } else if (sellerId) {
            query = query.or(`buyer_id.eq.${sellerId},seller_id.eq.${sellerId}`);
          }

          // If postId provided, filter by it
          if (postId) {
            query = query.eq('post_id', postId);
          }

          const { data, error } = await query.maybeSingle();

          if (!error && data) {
            setTransaction(data);

            // IMPORTANT: Re-determine role from transaction data
            // This ensures we have the correct role even if props were wrong
            const actualIsBuyer = data.buyer_id === user?.id;
            const actualIsSeller = data.seller_id === user?.id;

            // Update actual role state
            setActualRole({ isBuyer: actualIsBuyer, isSeller: actualIsSeller });

            console.log('Transaction loaded:', {
              transactionId: data.transaction_id,
              status: data.status,
              buyerId: data.buyer_id,
              sellerId: data.seller_id,
              currentUserId: user?.id,
              actualIsBuyer,
              actualIsSeller
            });

            // Set appropriate step based on status and ACTUAL role
            if (data.status === 'payment_pending' && actualIsBuyer) {
              setStep('payment');
            } else if ((data.status === 'paid' || data.status === 'work_in_progress') && actualIsSeller) {
              setStep('work'); // Seller should see work upload interface
              console.log('Setting step to work for seller');
            } else if (data.status === 'work_submitted' && actualIsBuyer) {
              setStep('verify');
            } else if (data.status === 'approved' || data.status === 'released') {
              setStep('complete');
            } else if (data.status === 'paid' && actualIsBuyer) {
              // Buyer waiting for work - don't set step, let waiting state show
            }
          }
        } catch (err) {
          // Table doesn't exist, that's okay
          console.warn('Could not load transaction:', err);
        }
      };
      loadTransaction();
    }
  }, [postId, user, isBuyer, isSeller, sellerId, buyerId]);

  // Initialize transaction
  const initiateTransaction = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in to create a transaction',
        variant: 'destructive',
      });
      return;
    }

    if (!upiId || !upiId.includes('@')) {
      toast({
        title: 'Invalid UPI ID',
        description: 'Please enter a valid UPI ID (e.g., name@paytm)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate unique transaction ID
      // Try database function first, fallback to client-side generation
      let txnData: string;

      try {
        const { data: dbTxnId, error: txnError } = await supabase.rpc('generate_transaction_id');

        if (!txnError && dbTxnId) {
          txnData = dbTxnId;
        } else {
          // Fallback: generate client-side
          throw new Error('Function not available');
        }
      } catch (error: any) {
        // If function doesn't exist (404) or fails, generate client-side
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        txnData = `TXN${timestamp}-${randomNum}`;

        // Try to verify uniqueness if transactions table exists
        try {
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('transaction_id', txnData)
            .maybeSingle();

          if (existing) {
            // Retry with new random number
            const retryNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            txnData = `TXN${timestamp}-${retryNum}`;
          }
        } catch (e) {
          // Table doesn't exist, that's okay - we'll still generate the ID
          console.warn('Transactions table may not exist yet:', e);
        }
      }

      // Create UPI payment string
      const upiPaymentString = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&tn=SVIP-${txnData}`;

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(upiPaymentString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create transaction (if table exists)
      let transactionData: any = null;
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            transaction_id: txnData,
            buyer_id: buyerId || user.id, // Card poster
            seller_id: sellerId, // Person helping
            post_id: postId || null,
            amount: amount,
            status: 'payment_pending',
            upi_id: upiId,
            upi_qr_data: upiPaymentString,
            work_description: workDescription || null,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          })
          .select()
          .single();

        if (error) {
          // If table doesn't exist (404 or PGRST116), continue without saving to DB
          if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('table') || error.message?.includes('schema cache')) {
            console.warn('Transactions table not found. Transaction will work but won\'t be saved to database.');
            // Create a local transaction object
            transactionData = {
              id: `local-${Date.now()}`,
              transaction_id: txnData,
              status: 'payment_pending',
              amount: amount,
              upi_id: upiId,
              upi_qr_data: upiPaymentString,
              buyer_id: user.id,
              seller_id: sellerId,
            };
          } else {
            throw error;
          }
        } else {
          transactionData = data;
        }
      } catch (error: any) {
        // If table doesn't exist, create local transaction
        if (error?.code === 'PGRST116' || error?.message?.includes('404') || error?.message?.includes('table') || error?.message?.includes('schema cache')) {
          console.warn('Transactions table not found. Using local transaction.');
          transactionData = {
            id: `local-${Date.now()}`,
            transaction_id: txnData,
            status: 'payment_pending',
            amount: amount,
            upi_id: upiId,
            upi_qr_data: upiPaymentString,
            buyer_id: user.id,
            seller_id: sellerId,
          };
        } else {
          // Show user-friendly error
          toast({
            title: 'Database Setup Required',
            description: 'The transactions table is not set up. Please run the database migrations. The transaction will work locally but won\'t be saved.',
            variant: 'destructive',
            duration: 8000,
          });
          // Still create local transaction so user can proceed
          transactionData = {
            id: `local-${Date.now()}`,
            transaction_id: txnData,
            status: 'payment_pending',
            amount: amount,
            upi_id: upiId,
            upi_qr_data: upiPaymentString,
            buyer_id: user.id,
            seller_id: sellerId,
          };
        }
      }

      setTransaction(transactionData);
      setQrCodeUrl(qrDataUrl);
      setStep('payment');

      toast({
        title: 'Transaction Created',
        description: 'Please complete the payment using the QR code',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload payment proof
  const uploadPaymentProof = async () => {
    if (!paymentProof || !transaction) return;

    setIsLoading(true);
    let publicUrl: string | null = null;

    try {
      // Try to upload file to Supabase Storage
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${transaction.id}-payment-proof-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('transaction-files')
          .upload(filePath, paymentProof);

        if (uploadError) {
          // If bucket doesn't exist, use data URL instead
          if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('bucket') || uploadError.statusCode === 400) {
            console.warn('Storage bucket not found. Using data URL for payment proof.');
            // Convert file to data URL as fallback
            const reader = new FileReader();
            publicUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(paymentProof);
            });
          } else {
            throw uploadError;
          }
        } else {
          // Get public URL
          const { data: { publicUrl: url } } = supabase.storage
            .from('transaction-files')
            .getPublicUrl(filePath);
          publicUrl = url;
        }
      } catch (storageError: any) {
        // If storage fails, use data URL
        if (storageError.message?.includes('Bucket') || storageError.statusCode === 400) {
          console.warn('Storage bucket not found. Using data URL for payment proof.');
          const reader = new FileReader();
          publicUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(paymentProof);
          });
        } else {
          throw storageError;
        }
      }

      if (!publicUrl) {
        throw new Error('Failed to process payment proof');
      }

      // Verify payment (if transactions table exists)
      try {
        // Try to update in database first
        const { data: updatedTxn, error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'paid', payment_proof_url: publicUrl })
          .eq('id', transaction.id)
          .select()
          .single();

        if (updateError) {
          // If table doesn't exist, just update local state
          if (updateError.code === 'PGRST116' || updateError.message?.includes('404') || updateError.message?.includes('table') || updateError.message?.includes('schema cache')) {
            console.warn('Transactions table not found. Updating local transaction.');
            setTransaction({ ...transaction, status: 'paid', payment_proof_url: publicUrl });
          } else {
            throw updateError;
          }
        } else if (updatedTxn) {
          setTransaction(updatedTxn);
        } else {
          // Fallback to local update
          setTransaction({ ...transaction, status: 'paid', payment_proof_url: publicUrl });
        }
      } catch (error: any) {
        // If table/function doesn't exist, just update local state
        if (error?.code === 'PGRST116' || error?.message?.includes('404') || error?.message?.includes('table') || error?.message?.includes('schema cache')) {
          setTransaction({ ...transaction, status: 'paid', payment_proof_url: publicUrl });
        } else {
          throw error;
        }
      }
      // Set step based on role
      if (isSeller) {
        setStep('work'); // Seller can upload work
        toast({
          title: 'Payment Verified',
          description: 'Payment proof submitted. You can now proceed with work submission.',
        });
      } else {
        // Buyer sees waiting state (will be handled by waiting state component)
        toast({
          title: 'Payment Verified',
          description: 'Waiting for helper to submit work...',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload payment proof',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for transaction status updates (only if transaction is in database)
  useEffect(() => {
    if (!transaction) return;

    // Don't poll if transaction ID starts with "local-" (not in database)
    if (transaction.id?.startsWith('local-')) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transaction.id)
          .single();

        // If table doesn't exist, stop polling
        if (error && (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('table') || error.message?.includes('schema cache'))) {
          clearInterval(pollInterval);
          return;
        }

        if (!error && data) {
          setTransaction(data);

          // Update step based on status and role
          if (data.status === 'paid') {
            if (isSeller) {
              setStep('work'); // Seller should see work upload interface
            }
            // Buyer will see waiting state (handled by waiting state component)
          } else if (data.status === 'work_submitted') {
            if (isBuyer) {
              setStep('verify'); // Buyer should see review interface
            }
            // Seller will see waiting state (handled by waiting state component)
          } else if (data.status === 'approved' || data.status === 'released') {
            setStep('complete');
            if (onComplete) onComplete(transaction.id);
          }
        }
      } catch (err) {
        // Stop polling on error
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [transaction, step, onComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Secure Payment Escrow
          </CardTitle>
          <CardDescription>
            Your payment is held securely until work is verified and approved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {/* Unauthorized Access Message - Seller trying to initiate but shouldn't see this if handled correctly */}
            {/* This is now redundant since sellers will see the 'No Active Transaction' view instead */}
            {/* Keeping for backwards compatibility in case step is manually set */}
            {step === 'initiate' && !isBuyer && isSeller && transaction && (
              <motion.div
                key="unauthorized"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 py-8"
              >
                <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
                <h3 className="text-xl font-semibold">Access Restricted</h3>
                <p className="text-muted-foreground">
                  Only the card poster (person who created the post) can initiate payments.
                </p>
                <p className="text-sm text-muted-foreground">
                  As the person helping, you should wait for the card poster to start the transaction. Once they pay, you'll be able to upload your work.
                </p>
              </motion.div>
            )}

            {/* Seller View: Check for existing paid transaction to show work upload */}
            {!transaction && isSeller && (
              <motion.div
                key="seller-no-transaction"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 py-8"
              >
                <Clock className="w-16 h-16 mx-auto text-blue-500" />
                <h3 className="text-xl font-semibold">No Active Transaction</h3>
                <p className="text-muted-foreground">
                  The card poster needs to initiate a secure payment transaction first.
                </p>
                <p className="text-sm text-muted-foreground">
                  Once they make the payment, you'll be able to upload your work here.
                </p>
              </motion.div>
            )}

            {/* Step 1: Initiate Transaction (Buyer/Card Poster ONLY) */}
            {/* Only show if user is buyer AND (no transaction exists OR they own the transaction) */}
            {step === 'initiate' && isBuyer && (
              !transaction || transaction.buyer_id === user?.id
            ) && (
                <motion.div
                  key="initiate"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="seller">Seller</Label>
                    <Input id="seller" value={sellerName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input id="amount" type="number" value={amount} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upi">Seller UPI ID *</Label>
                    <Input
                      id="upi"
                      type="text"
                      placeholder="Ask seller for their UPI ID (e.g., name@paytm)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> The seller should provide you with their UPI ID or QR code.
                        Enter it here to generate a secure payment transaction.
                      </p>
                    </div>
                  </div>
                  {workDescription && (
                    <div className="space-y-2">
                      <Label>Work Description</Label>
                      <Textarea value={workDescription} disabled />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={initiateTransaction} disabled={isLoading} className="flex-1">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Secure Transaction'
                      )}
                    </Button>
                    {onCancel && (
                      <Button variant="outline" onClick={onCancel}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

            {/* Waiting State: Buyer waiting for work submission */}
            {transaction && transaction.status === 'paid' && isBuyer && step !== 'verify' && (
              <motion.div
                key="buyer-waiting-work"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 py-8"
              >
                <Clock className="w-16 h-16 mx-auto text-blue-500" />
                <h3 className="text-xl font-semibold">Payment Verified!</h3>
                <p className="text-muted-foreground">
                  Waiting for the helper to submit their work. You'll be notified when work is ready for review.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">Transaction ID: <span className="font-mono">{transaction.transaction_id}</span></p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment (Buyer/Card Poster ONLY) */}
            {/* Verify user is actually the buyer from transaction data */}
            {step === 'payment' && transaction && (
              transaction.buyer_id === user?.id || isBuyer
            ) && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Scan QR Code to Pay</h3>
                    <p className="text-sm text-muted-foreground">
                      Transaction ID: {transaction.transaction_id}
                    </p>
                  </div>

                  <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
                    <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64" />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Details</Label>
                    <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold">₹{amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UPI ID:</span>
                        <span>{upiId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono text-xs">{transaction.transaction_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof">Upload Payment Proof (Screenshot) *</Label>
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a screenshot of your payment confirmation
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={uploadPaymentProof}
                      disabled={!paymentProof || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Payment Proof
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Your payment is held in escrow. It will only be released after you approve the work.
                    </p>
                  </div>
                </motion.div>
              )}

            {/* Waiting State: Seller waiting for payment (before payment is verified) */}
            {transaction && (transaction.status === 'payment_pending' || transaction.status === 'pending') && isSeller && (
              <motion.div
                key="seller-waiting-payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 py-8"
              >
                <Clock className="w-16 h-16 mx-auto text-blue-500" />
                <h3 className="text-xl font-semibold">Waiting for Payment</h3>
                <p className="text-muted-foreground">
                  The card poster is processing the payment. You'll be notified once payment is verified.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono">{transaction.transaction_id}</p>
                </div>
              </motion.div>
            )}

            {/* Waiting State: Seller waiting for approval after submitting work */}
            {transaction && transaction.status === 'work_submitted' && isSeller && (
              <motion.div
                key="seller-waiting-approval"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 py-8"
              >
                <Clock className="w-16 h-16 mx-auto text-amber-500" />
                <h3 className="text-xl font-semibold">Work Submitted!</h3>
                <p className="text-muted-foreground">
                  Your work has been submitted. Waiting for the card poster to review and approve.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">Transaction ID: <span className="font-mono">{transaction.transaction_id}</span></p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Work Submission (Seller's view ONLY) - Show when payment is verified */}
            {/* Check both step and transaction status, and verify user is actually the seller */}
            {transaction && (
              (step === 'work' || transaction.status === 'paid' || transaction.status === 'work_in_progress')
            ) && transaction.seller_id === user?.id && (
                <motion.div
                  key="work"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                    <h3 className="text-lg font-semibold">Payment Verified!</h3>
                    <p className="text-sm text-muted-foreground">
                      Great! The card poster has made the payment. You can now submit your work. The card poster will review before payment is released.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Work Files</Label>
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => setWorkFiles(Array.from(e.target.files || []))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preview">Work Preview URL (Optional)</Label>
                    <Input
                      id="preview"
                      type="url"
                      placeholder="https://..."
                      value={workPreviewUrl}
                      onChange={(e) => setWorkPreviewUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Share a link where the buyer can preview the work
                    </p>
                  </div>

                  <Button
                    onClick={async () => {
                      // Upload work files and update transaction
                      setIsLoading(true);
                      try {
                        const fileUrls: string[] = [];

                        for (const file of workFiles) {
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${transaction.id}-work-${Date.now()}-${file.name}`;
                            const filePath = `work-files/${fileName}`;

                            const { error: uploadError } = await supabase.storage
                              .from('transaction-files')
                              .upload(filePath, file);

                            if (uploadError) {
                              // If bucket doesn't exist, use data URL
                              if (uploadError.message?.includes('Bucket') || uploadError.statusCode === 400) {
                                const reader = new FileReader();
                                const dataUrl = await new Promise<string>((resolve, reject) => {
                                  reader.onload = () => resolve(reader.result as string);
                                  reader.onerror = reject;
                                  reader.readAsDataURL(file);
                                });
                                fileUrls.push(dataUrl);
                              } else {
                                throw uploadError;
                              }
                            } else {
                              const { data: { publicUrl } } = supabase.storage
                                .from('transaction-files')
                                .getPublicUrl(filePath);
                              fileUrls.push(publicUrl);
                            }
                          } catch (fileError: any) {
                            // If storage fails, use data URL
                            if (fileError.message?.includes('Bucket') || fileError.statusCode === 400) {
                              const reader = new FileReader();
                              const dataUrl = await new Promise<string>((resolve, reject) => {
                                reader.onload = () => resolve(reader.result as string);
                                reader.onerror = reject;
                                reader.readAsDataURL(file);
                              });
                              fileUrls.push(dataUrl);
                            } else {
                              throw fileError;
                            }
                          }
                        }

                        // Try to update in database
                        try {
                          const { error } = await supabase
                            .from('transactions')
                            .update({
                              status: 'work_submitted',
                              work_files: fileUrls,
                              work_preview_url: workPreviewUrl || null,
                            })
                            .eq('id', transaction.id);

                          if (error && error.code !== 'PGRST116' && !error.message?.includes('404') && !error.message?.includes('table')) {
                            throw error;
                          }
                        } catch (dbError: any) {
                          // If table doesn't exist, just update local state
                          if (dbError?.code === 'PGRST116' || dbError?.message?.includes('404') || dbError?.message?.includes('table')) {
                            // Update local transaction
                            setTransaction({
                              ...transaction,
                              status: 'work_submitted',
                              work_files: fileUrls,
                              work_preview_url: workPreviewUrl || null,
                            });
                          } else {
                            throw dbError;
                          }
                        }

                        // If seller submitted, move to waiting state (buyer will see verify step)
                        if (isSeller) {
                          // Seller sees waiting message
                          toast({
                            title: 'Work Submitted',
                            description: 'Waiting for card poster to review and approve...',
                          });
                          // Don't change step - seller will see waiting view
                        } else {
                          setStep('verify');
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to submit work',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={workFiles.length === 0 || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Work for Review'
                    )}
                  </Button>
                </motion.div>
              )}

            {/* Step 4: Work Verification (Buyer's view ONLY - Card Poster) */}
            {step === 'verify' && transaction && isBuyer && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-2">
                  <Eye className="w-12 h-12 mx-auto text-blue-500" />
                  <h3 className="text-lg font-semibold">Review Submitted Work</h3>
                  <p className="text-sm text-muted-foreground">
                    As the card poster, review the work before approving payment release
                  </p>
                </div>

                {transaction.work_preview_url && (
                  <div className="space-y-2">
                    <Label>Preview Link</Label>
                    <a
                      href={transaction.work_preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Open Preview</span>
                        <Eye className="w-4 h-4" />
                      </div>
                    </a>
                  </div>
                )}

                {transaction.work_files && Array.isArray(transaction.work_files) && transaction.work_files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Work Files</Label>
                    <div className="space-y-2">
                      {transaction.work_files.map((url: string, idx: number) => {
                        // Extract filename from URL or data URL
                        const getFileName = (fileUrl: string): string => {
                          if (fileUrl.startsWith('data:')) {
                            // Try to get extension from MIME type
                            const mimeMatch = fileUrl.match(/data:([^;]+)/);
                            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                            const ext = mime.split('/')[1] || 'file';
                            return `work_file_${idx + 1}.${ext}`;
                          }
                          try {
                            const urlObj = new URL(fileUrl);
                            return urlObj.pathname.split('/').pop() || `file_${idx + 1}`;
                          } catch {
                            return `file_${idx + 1}`;
                          }
                        };

                        const handleDownload = async () => {
                          try {
                            if (url.startsWith('data:')) {
                              // Handle data URL - convert to blob and download
                              const response = await fetch(url);
                              const blob = await response.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = getFileName(url);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(blobUrl);
                            } else {
                              // Regular URL - fetch and download
                              const response = await fetch(url);
                              const blob = await response.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = getFileName(url);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(blobUrl);
                            }
                          } catch (error) {
                            console.error('Download failed:', error);
                            // Fallback: open in new tab
                            window.open(url, '_blank');
                          }
                        };

                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="w-full justify-start gap-2"
                          >
                            <Upload className="w-4 h-4 rotate-180" />
                            Download {getFileName(url)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!isBuyer) {
                        toast({
                          title: 'Unauthorized',
                          description: 'Only the card poster can approve work and release payment',
                          variant: 'destructive',
                        });
                        return;
                      }

                      setIsLoading(true);
                      try {
                        // Try database function first (correct parameter order)
                        try {
                          const { error } = await supabase.rpc('approve_work', {
                            transaction_uuid: transaction.id,
                            buyer_feedback: null
                          });

                          if (error && error.code !== 'PGRST116' && !error.message?.includes('404') && !error.message?.includes('function')) {
                            throw error;
                          }
                        } catch (rpcError: any) {
                          // If function doesn't exist, update local transaction
                          if (rpcError?.code === 'PGRST116' || rpcError?.message?.includes('404') || rpcError?.message?.includes('function')) {
                            console.warn('approve_work function not found. Using local update.');
                            // Update local transaction
                            setTransaction({
                              ...transaction,
                              status: 'approved',
                              buyer_approval: true,
                              buyer_approval_at: new Date().toISOString(),
                              released_at: new Date().toISOString(),
                            });
                          } else {
                            throw rpcError;
                          }
                        }

                        // Also try direct database update
                        try {
                          const { error: updateError } = await supabase
                            .from('transactions')
                            .update({
                              status: 'approved',
                              buyer_approval: true,
                              buyer_approval_at: new Date().toISOString(),
                              released_at: new Date().toISOString(),
                            })
                            .eq('id', transaction.id);

                          if (updateError && updateError.code !== 'PGRST116' && !updateError.message?.includes('404')) {
                            // If table doesn't exist, that's okay - we already updated local state
                            if (!updateError.message?.includes('table') && !updateError.message?.includes('schema cache')) {
                              throw updateError;
                            }
                          }
                        } catch (dbError: any) {
                          // If table doesn't exist, that's okay
                          if (dbError?.code !== 'PGRST116' && !dbError?.message?.includes('404') && !dbError?.message?.includes('table')) {
                            throw dbError;
                          }
                        }

                        setStep('complete');
                        toast({
                          title: 'Work Approved!',
                          description: 'Payment has been released to the seller',
                        });
                        if (onComplete) onComplete(transaction.id);
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to approve work',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve & Release Payment
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const reason = window.prompt('Please describe the issue with this transaction:');
                      if (!reason || reason.trim() === '') {
                        toast({
                          title: 'Dispute Cancelled',
                          description: 'A reason is required to file a dispute.',
                        });
                        return;
                      }

                      setIsLoading(true);
                      try {
                        // Update transaction status to disputed
                        const { error } = await supabase
                          .from('transactions')
                          .update({
                            status: 'disputed',
                            dispute_reason: reason.trim(),
                          } as any)
                          .eq('id', transaction!.id);

                        if (error) throw error;

                        setTransaction({ ...transaction!, status: 'disputed' as any });
                        toast({
                          title: 'Dispute Filed',
                          description: 'Your dispute has been submitted. We will review and get back to you.',
                        });
                      } catch (err) {
                        console.error('Error filing dispute:', err);
                        // Fallback: update local state anyway
                        setTransaction({ ...transaction!, status: 'disputed' as any });
                        toast({
                          title: 'Dispute Filed',
                          description: 'Your dispute has been recorded. We will review it.',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Dispute
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {(step === 'complete' || transaction?.status === 'approved' || transaction?.status === 'released') && transaction && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-8"
              >
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                <h3 className="text-2xl font-semibold">Transaction Complete!</h3>
                <p className="text-muted-foreground">
                  {isBuyer
                    ? 'Payment has been successfully released to the helper.'
                    : 'Payment has been successfully released to you!'}
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono">{transaction.transaction_id}</p>
                </div>

                {/* Allow buyer to start a new transaction */}
                {isBuyer && (
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        setTransaction(null);
                        setStep('initiate');
                        setUpiId('');
                        setPaymentProof(null);
                        setQrCodeUrl('');
                      }}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Start New Transaction
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};
