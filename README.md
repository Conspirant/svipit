# S.V.I.P - Skill Value Interaction Platform

<div align="center">

![S.V.I.P Logo](https://img.shields.io/badge/S.V.I.P-Connect-blueviolet?style=for-the-badge&logo=react)

**Built on trust. Powered by students.**

*Connect locally to exchange skills, favors, or time — verified through your college ID.*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Team](#-team)
- [License](#-license)

---

## 🎯 About the Project

**S.V.I.P (Skill Value Interaction Platform)** is a peer-to-peer platform designed specifically for college students to exchange skills, services, and favors within their trusted campus community. The platform enables students to monetize their talents while helping fellow students with their needs — all within a secure, verified environment.

### Vision
To create a trusted ecosystem where students can leverage their unique skills and help each other grow, while building valuable professional experience.

---

## ❓ Problem Statement

College students often face the following challenges:

1. **Unmet Skill Needs**: Students need help with assignments, projects, tutoring, design work, coding, etc., but lack access to affordable and reliable help.
2. **Underutilized Talents**: Many students have valuable skills (graphic design, coding, photography, music) but no platform to monetize them locally.
3. **Trust Issues**: Existing freelance platforms lack the trust factor needed for student-to-student transactions.
4. **Payment Fraud**: Traditional P2P transactions run the risk of scams — either non-payment or non-delivery of work.

---

## 💡 Solution

S.V.I.P addresses these challenges by providing:

1. **College-Verified Users**: Only verified students from the same institution can access the platform.
2. **Secure Escrow Payments**: Money is held safely until work is delivered and approved.
3. **Trust Score System**: Users build reputation through successful transactions.
4. **Real-time Communication**: Built-in messaging system for seamless coordination.

---

## ✨ Key Features

### 🔐 Authentication & Verification
- College email verification
- Profile setup with skills and bio
- Trust score based on transaction history

### 📝 Post Creation & Discovery
- Create service requests or skill offerings
- Browse posts from verified students
- Filter by category, skills, and price range

### 💬 Real-time Messaging
- Direct messaging between buyers and sellers
- Real-time chat updates via Supabase Realtime
- Message history and conversation management

### 💰 Secure Escrow Payment System
- **Step 1**: Buyer initiates transaction with UPI payment
- **Step 2**: Payment held in escrow (not released to seller)
- **Step 3**: Seller completes and submits work
- **Step 4**: Buyer reviews and approves work
- **Step 5**: Payment released to seller upon approval

### 🛡️ Anti-Fraud Protection
- Unique transaction IDs for tracking
- Payment proof verification (screenshot upload)
- Work submission verification
- Dispute resolution mechanism
- Complete audit trail for all transactions

### ⭐ Trust Score System
- Builds reputation through successful transactions
- Displayed on user profiles
- Helps in decision-making for new transactions

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI components and type safety |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive design system |
| **State Management** | TanStack Query | Server state and caching |
| **Routing** | React Router v6 | Client-side navigation |
| **Animations** | Framer Motion | Smooth transitions and micro-interactions |
| **Backend** | Supabase | PostgreSQL database, Auth, Realtime, Storage |
| **Payment QR** | qrcode library | UPI QR code generation |
| **Build Tool** | Vite | Fast development and optimized builds |
| **Form Handling** | React Hook Form + Zod | Form validation and management |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    React    │  │  TanStack   │  │   Framer    │  │   React     │ │
│  │ Components  │  │   Query     │  │   Motion    │  │   Router    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Supabase Backend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  PostgreSQL │  │    Auth     │  │  Realtime   │  │   Storage   │ │
│  │  Database   │  │   System    │  │  Subscript. │  │   (Files)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Row Level Security (RLS)                  │   │
│  │              Ensures data access is user-specific            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with skills, bio, trust score |
| `posts` | Service requests and skill offerings |
| `conversations` | Chat conversations between users |
| `messages` | Individual messages within conversations |
| `transactions` | Payment and work exchange records |
| `transaction_verifications` | Payment and work verification tracking |
| `transaction_logs` | Complete audit trail |

### Transaction Flow States

```
pending → payment_pending → paid → work_in_progress → 
work_submitted → approved → released
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or bun
- Supabase account

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/s.v.i.p-connect.git
   cd s.v.i.p-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_PROJECT_ID=your_project_id
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   VITE_SUPABASE_URL=https://your_project_id.supabase.co
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL migrations from `/supabase` folder
   - Create a storage bucket named `transaction-files`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
s.v.i.p-connect/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── chat/               # Messaging components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── payment/            # Transaction & escrow components
│   │   └── profile/            # Profile components
│   ├── hooks/
│   │   ├── useAuth.tsx         # Authentication hook
│   │   └── useTransaction.tsx  # Transaction management hook
│   ├── integrations/
│   │   └── supabase/           # Supabase client & types
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── pages/
│   │   ├── Auth.tsx            # Login/Register page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Messages.tsx        # Chat interface
│   │   ├── Profile.tsx         # User profile
│   │   └── ProfileSetup.tsx    # Initial profile setup
│   ├── App.tsx                 # Root component with routing
│   └── main.tsx                # Entry point
├── supabase/
│   └── migrations/             # Database migration files
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 🔮 Future Enhancements

- [ ] **Mobile App**: React Native version for iOS and Android
- [ ] **Automated Payment Verification**: Integration with UPI APIs
- [ ] **AI-Powered Matching**: Smart recommendations based on skills and needs
- [ ] **Milestone Payments**: Partial release for larger projects
- [ ] **Rating & Review System**: Detailed feedback after transactions
- [ ] **Multi-Institution Support**: Expand beyond single college
- [ ] **Skill Certification**: Verified skill badges
- [ ] **Analytics Dashboard**: Insights for users on their transactions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for students, by students**

*S.V.I.P - Where Skills Meet Value*

</div>
