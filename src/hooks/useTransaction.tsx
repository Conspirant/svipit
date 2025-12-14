import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Transaction {
  id: string;
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  post_id: string | null;
  amount: number;
  status: string;
  upi_id: string | null;
  payment_proof_url: string | null;
  work_files: string[] | null;
  work_preview_url: string | null;
  buyer_approval: boolean;
  created_at: string;
  updated_at: string;
}

export const useTransaction = (transactionId?: string) => {
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId || !user) {
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single();

        if (fetchError) throw fetchError;

        // Verify user has access
        if (data.buyer_id !== user.id && data.seller_id !== user.id) {
          throw new Error('Unauthorized access to transaction');
        }

        setTransaction(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`transaction:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          setTransaction(payload.new as Transaction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId, user]);

  return { transaction, loading, error };
};
