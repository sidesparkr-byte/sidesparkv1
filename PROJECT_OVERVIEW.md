# SideSpark Project Overview

## What This Is
SideSpark is a mobile-first web app built for verified Butler students. The current MVP is a message-first marketplace and co-founder matching app. Users can sign in, create profiles, post listings, browse listings, message each other in real time, submit "Looking For" requests, explore housing, and match with co-founders.

The launch direction right now is:
- no in-app payments
- no payout onboarding required for sellers
- buyers and sellers coordinate directly in chat

## Tech Stack
- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Vitest for tests

## High-Level Structure

### `/src/app`
This is the application itself: pages, layouts, and API routes.

- `layout.tsx`
  Root layout for the whole app. Sets metadata, manifest, viewport, and the phone-style app frame.

- `(auth)/`
  All authentication-related screens.
  - `login/` handles OTP login and signup mode.
  - `verify/` shows the "check your email" flow.
  - `onboarding/` collects first name, last initial, graduation year, major, bio, and avatar.

- `(main)/`
  Main in-app experience after login.
  - `market/` browsing, listing detail, sell flows, housing, and Looking For.
  - `messages/` conversation inbox and thread view.
  - `activity/` messages summary, listed items, and Looking For request management.
  - `co-founders/` co-founder profile setup and matching.
  - `profile/` account profile and logout.

- `api/`
  Server-side route handlers used by the frontend.
  - `market` powers the market feed.
  - `looking-for` creates and updates requests.
  - `cofounders` handles co-founder profile and match actions.
  - `admin/looking-for` handles admin request updates.
  - `landlords/checkout-session` is a legacy name but currently just publishes landlord listings.

- `callback/route.ts`
  Handles Supabase auth callback and session exchange.

- `landlords/`
  Separate landlord-facing housing flow: landing page, onboarding, create listing, dashboard.

- `dev/quick-login/`
  Dev-only route for switching into seeded test users without using real inboxes.

### `/src/components/ui`
Reusable UI building blocks.

- Buttons, inputs, textarea, select, modal, toast, badge, avatar, card, tabs, empty states
- `app-top-bar.tsx` and `bottom-nav.tsx` define the mobile shell
- `placeholder-card.tsx` is a convenience wrapper used in Profile and Activity
- `text-input.tsx` is a light input used in the chat composer

### `/src/lib`
Shared logic and helpers.

- `supabase/`
  Browser, server, and middleware Supabase clients.
- `media.ts`
  Normalizes Supabase storage paths into browser-safe image URLs.
- `nav.ts`
  Bottom navigation definition.
- `dev-preview.ts`
  Dev flags for preview mode, any-email auth, and quick login.
- `market/`
  Market filter config and shared types.
- `looking-for/`
  Validation and constants for Looking For requests.
- `cofounders.ts`
  Shared co-founder helpers.
- `utils/fees.ts`
  Legacy fee engine. Still present, but no longer used for the launch MVP payment UX.

### `/supabase/migrations`
Database schema history.

- Full SideSpark schema
- Looking For request status extension
- Co-founder matching and nullable listing conversations
- New-user profile creation trigger

### `/scripts`
- `seed-test-users.mjs`
  Local script that creates confirmed test users and optional sample listings.

## What Is Built Right Now

### 1. Auth and Onboarding
- OTP login
- Signup path using same OTP flow
- Verify-email screen
- Supabase callback handling
- Butler-only enforcement, with dev bypass available
- Profile onboarding after first login

### 2. Market
- Search bar
- Category chips
- Listing feed
- Listing detail page
- Student sublets and landlord listings inside Housing
- Seller-aware listing detail state
- Message-first CTA instead of checkout

### 3. Listing Creation
- Items
- Services
- Tutoring
- Sublets
- Photo uploads to Supabase Storage
- Validation and category-specific fields

### 4. Messaging
- Conversation creation from listing detail
- Inbox page
- Thread page
- Realtime updates with polling fallback
- Left/right colored message bubbles
- Quick replies
- Off-platform warning detection

### 5. Looking For
- Create request form
- Activity management view
- Close/archive flow
- Admin review page

### 6. Co-founders
- First-time setup
- Browse cards
- Interested / Pass actions
- Mutual match flow into chat

### 7. Housing
- Unified browse flow inside Market
- Student sublets
- Landlord listings
- Housing detail screens
- Landlord onboarding and listing publishing flow

### 8. Dev and Test Tools
- Preview mode
- Any-email auth bypass for dev
- Quick-login route
- Test-user seeding

## What Is Connected
These features are not just static UI; they are wired into Supabase.

- Auth is connected to Supabase Auth
- Profiles are stored in Postgres
- Listings are stored in Postgres
- Messages and conversations are stored in Postgres
- Realtime messaging is connected through Supabase Realtime
- Avatars use Supabase Storage
- Listing photos use Supabase Storage
- Looking For requests are stored in Postgres
- Co-founder profiles and matches are stored in Postgres
- Housing listings are stored in Postgres

## Current MVP Product Rules
- No in-app payments
- No checkout flow
- No payout onboarding required
- Listings still have prices, but chat is how users coordinate trades
- Housing is discovery plus messaging, not payments

## Known Legacy or Secondary Pieces
- `src/app/(main)/market/[id]/purchase-coming-soon-cta.tsx`
  Legacy payment modal component. No longer part of the active listing detail flow.
- `src/app/(main)/market/sell/_components/fee-preview.tsx`
  Legacy fee preview component. No longer used in sell flows.
- `src/lib/utils/fees.ts`
  Still useful for formatting currency and future payment work, but not driving launch MVP UX.
- `src/app/api/landlords/checkout-session/route.ts`
  Misnamed. It currently publishes landlord listings directly.

## Safe Deletions Right Now
These can be removed without affecting the current runtime:
- `src/app/(main)/market/[id]/purchase-coming-soon-cta.tsx`
- `src/app/(main)/market/sell/_components/fee-preview.tsx`
- `src/components/ui/primary-button.tsx`

## Not Safe To Delete
- `src/middleware.ts`
- anything under `src/lib/supabase`
- any auth routes
- any active Market, Messages, Activity, Co-founders, Profile routes
- `src/lib/media.ts`
- database migrations

## Main App Flow
1. User logs in with OTP
2. New user completes onboarding
3. User lands on Market
4. User browses listings or creates a listing
5. User messages another user from the listing detail page
6. User manages activity, listed items, Looking For requests, and co-founder interests

## Current Launch Readiness
This is a strong local MVP, but not yet a production-ready launch.

What is already solid:
- core app shell
- auth
- listing creation
- browsing
- messaging
- co-founders
- housing browsing

What still needs hardening before launch:
- final local QA across all user flows
- performance pass
- security and RLS audit
- production deploy setup
- monitoring
- removal or cleanup of legacy code paths

## Recommendation
Keep building and stabilizing locally first. Then move to a Vercel preview deployment once the core user flows are consistently working without manual workaround steps.
