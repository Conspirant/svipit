# Payment System Setup Guide

## Prerequisites

1. Supabase project with database access
2. Storage bucket configured
3. Database migrations applied

## Step 1: Run Database Migration

Apply the payment escrow system migration:

```bash
# If using Supabase CLI
supabase migration up

# Or apply manually in Supabase Dashboard:
# SQL Editor → Run the migration file:
# supabase/migrations/20251215000000_payment_escrow_system.sql
```

## Step 2: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `transaction-files`
3. Set bucket to **Public** (or configure RLS policies)
4. Configure allowed file types:
   - Images: `image/*`
   - Documents: `.pdf`, `.doc`, `.docx`
   - Archives: `.zip`, `.rar`
   - Code: `.js`, `.ts`, `.py`, etc.

### Storage RLS Policies

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload transaction files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transaction-files');

-- Allow users to view files in their transactions
CREATE POLICY "Users can view transaction files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'transaction-files');
```

## Step 3: Install Dependencies

The payment system requires the `qrcode` package (already installed):

```bash
npm install qrcode @types/qrcode
```

## Step 4: Verify Database Functions

Ensure these functions exist in your database:

1. `generate_transaction_id()` - Generates unique transaction IDs
2. `verify_payment(transaction_uuid, payment_proof_url)` - Verifies payment
3. `approve_work(transaction_uuid, buyer_feedback)` - Approves work and releases payment
4. `log_transaction_action()` - Logs transaction actions (trigger function)

## Step 5: Test the System

### Test Transaction Flow:

1. **Create Transaction**
   - Navigate to a post/offer
   - Click "Start Transaction"
   - Enter seller's UPI ID
   - Generate QR code

2. **Payment Process**
   - Scan QR code with UPI app
   - Complete payment
   - Upload payment proof screenshot
   - Verify payment

3. **Work Submission**
   - Seller uploads work files
   - Seller provides preview link (optional)
   - Submit work for review

4. **Work Approval**
   - Buyer reviews work
   - Buyer approves or disputes
   - Payment released upon approval

## Troubleshooting

### QR Code Not Generating
- Check if `qrcode` package is installed
- Verify browser console for errors
- Ensure UPI ID format is correct (e.g., `name@paytm`)

### Payment Proof Upload Fails
- Verify storage bucket exists
- Check storage bucket permissions
- Ensure file size is within limits

### Transaction Status Not Updating
- Check realtime subscriptions
- Verify RLS policies allow updates
- Check transaction logs for errors

### Work Files Not Accessible
- Verify storage bucket is public or RLS allows access
- Check file URLs are correct
- Ensure files were uploaded successfully

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Storage bucket permissions configured
- [ ] Transaction IDs are unique
- [ ] Payment proof verification working
- [ ] Work approval requires buyer action
- [ ] All actions logged in transaction_logs
- [ ] Expiration times set for transactions
- [ ] Dispute mechanism functional

## Production Considerations

1. **Payment Verification**
   - Consider integrating with UPI payment gateway APIs
   - Implement automated payment verification
   - Add fraud detection

2. **File Storage**
   - Set appropriate file size limits
   - Implement virus scanning
   - Add CDN for file delivery

3. **Notifications**
   - Email notifications for status changes
   - Push notifications for mobile apps
   - SMS for critical updates

4. **Monitoring**
   - Monitor transaction success rates
   - Track dispute resolution times
   - Alert on failed transactions

5. **Compliance**
   - Ensure GDPR compliance for data
   - Follow payment regulations
   - Maintain audit logs

## Support

For issues or questions:
1. Check transaction logs in database
2. Review error messages in browser console
3. Verify database functions are working
4. Check Supabase logs for server errors
