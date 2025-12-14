# Role-Based Payment System

## Overview

The payment system now enforces strict role-based access:
- **Card Poster (Buyer)**: Person who created the post/request
- **Person Helping (Seller)**: Service provider who will do the work

## Access Control

### Card Poster (Buyer) Can:
✅ **Initiate transactions** - Start payment process
✅ **Make payments** - Scan QR code and pay
✅ **Upload payment proof** - Submit payment screenshot
✅ **Review work** - Preview submitted work
✅ **Approve & release payment** - Approve work and release funds
✅ **Dispute work** - Raise disputes if work is unsatisfactory

### Person Helping (Seller) Can:
✅ **View payment status** - See when payment is verified
✅ **Upload work files** - Submit completed work
✅ **Provide preview links** - Share work preview URLs
✅ **Submit work for review** - Submit work to buyer
✅ **View transaction status** - See approval status

### What Each Role CANNOT Do:

❌ **Card Poster CANNOT:**
- Upload work files
- Submit work for review
- See work upload interface

❌ **Person Helping CANNOT:**
- Initiate transactions
- Make payments
- Approve work
- Release payments
- See payment/approval interface

## Workflow

### 1. Card Poster Initiates Payment
```
Card Poster (Buyer)
  ↓
Clicks "Secure Payment"
  ↓
Enters seller's UPI ID
  ↓
Generates QR code
  ↓
Pays via UPI
  ↓
Uploads payment proof
```

### 2. Person Helping Submits Work
```
Person Helping (Seller)
  ↓
Receives notification: "Payment verified"
  ↓
Uploads work files
  ↓
Provides preview link (optional)
  ↓
Submits work for review
```

### 3. Card Poster Reviews & Approves
```
Card Poster (Buyer)
  ↓
Receives notification: "Work submitted"
  ↓
Reviews work files
  ↓
Tests preview link
  ↓
Clicks "Approve & Release Payment"
  ↓
Payment released to seller ✅
```

## Security Features

### ✅ Role Verification
- System checks user ID against buyer/seller IDs
- Unauthorized access blocked
- Clear error messages for wrong role

### ✅ UI Restrictions
- Payment interface only shown to buyers
- Work upload only shown to sellers
- Waiting states for each role

### ✅ Database Security
- `approve_work()` function verifies buyer_id
- Only buyer can approve
- Seller cannot approve their own work

## Waiting States

### Seller Waiting for Payment
- Shows: "Waiting for Payment"
- Message: "Card poster is processing payment"
- Transaction ID displayed

### Seller Waiting for Approval
- Shows: "Work Submitted!"
- Message: "Waiting for card poster to review"
- Transaction ID displayed

### Buyer Waiting for Work
- Shows: "Payment Verified!"
- Message: "Waiting for helper to submit work"
- Transaction ID displayed

## Error Handling

### Unauthorized Access
- Shows: "Access Restricted"
- Message: "Only card poster can initiate payments"
- Prevents wrong user from accessing features

### Function Not Found
- Falls back to local transaction updates
- Works without database functions
- Shows warnings but doesn't crash

## Database Requirements

For full functionality, run migrations:
1. `20251215000000_payment_escrow_system.sql`
2. `20251215000001_chat_security.sql`

The system works without them but with limited features.

## Usage in Chat

When using in Messages component:
- `buyerId` = Current user (card poster)
- `sellerId` = Other user (person helping)
- System automatically determines roles
- Shows appropriate interface for each user

## Key Points

1. **Card Poster = Buyer** (pays, approves)
2. **Person Helping = Seller** (works, submits)
3. **Strict separation** of features
4. **Waiting states** for each role
5. **Security checks** at every step

This ensures the card poster has full control over payment release, and the person helping can only submit work, not approve payments!
