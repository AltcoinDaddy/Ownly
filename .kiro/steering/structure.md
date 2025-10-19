# Project Structure

## Directory Organization

### `/app` - Next.js App Router
- **`layout.tsx`** - Root layout with WalletProvider and global styles
- **`page.tsx`** - Homepage with Hero, Features, HowItWorks sections
- **`globals.css`** - Global Tailwind CSS styles
- **Route-based pages:**
  - `/marketplace` - NFT marketplace listing and browsing
  - `/mint` - NFT creation and minting interface
  - `/nft/[id]` - Individual NFT detail pages (dynamic routing)
  - `/profile` - User profile and owned NFTs
  - `/wallet` - Wallet connection and management

### `/components` - Reusable UI Components
- **Feature components:** `header.tsx`, `hero.tsx`, `features.tsx`, `how-it-works.tsx`, `footer.tsx`, `nft-card.tsx`
- **`/ui`** - shadcn/ui component library (Radix UI + Tailwind)
- **`theme-provider.tsx`** - Dark/light theme context

### `/lib` - Core Logic & Utilities
- **`/flow`** - Flow blockchain integration
  - `config.ts` - FCL configuration and contract addresses
  - `hooks.ts` - Flow-specific React hooks
  - `transactions.ts` - Flow transaction scripts
  - `scripts.ts` - Flow query scripts
  - `nft-service.ts` - NFT operations service
  - `marketplace.ts` - Marketplace contract interactions
  - `events.ts` - Flow event handling
  - `ipfs.ts` - IPFS metadata management
- **`wallet-context.tsx`** - Wallet connection state management
- **`types.ts`** - TypeScript type definitions
- **`utils.ts`** - Utility functions (cn, etc.)
- **`mock-data.ts`** - Development mock data

### `/hooks` - Custom React Hooks
- Reusable hooks for mobile detection and toast notifications

### `/public` - Static Assets
- NFT placeholder images and user avatars
- Logo and branding assets

### `/styles` - Additional Styling
- Global CSS overrides and custom styles

## Naming Conventions
- **Files:** kebab-case (`nft-card.tsx`, `how-it-works.tsx`)
- **Components:** PascalCase exports (`NFTCard`, `HowItWorks`)
- **Directories:** lowercase with hyphens for routes
- **Types:** PascalCase interfaces (`NFT`, `User`, `Transaction`)

## Import Patterns
- Use path aliases: `@/components`, `@/lib`, `@/hooks`
- Relative imports for co-located files
- Type-only imports: `import type { User } from "./types"`

## Architecture Patterns
- **Server Components** by default (Next.js App Router)
- **Client Components** marked with `"use client"` directive
- **Context Providers** for global state (WalletProvider)
- **Service Layer** in `/lib/flow` for blockchain operations
- **Component Composition** over inheritance
- **Loading States** with dedicated `loading.tsx` files per route