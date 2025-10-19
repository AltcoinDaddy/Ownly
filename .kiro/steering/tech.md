# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library with React Server Components (RSC)
- **TypeScript 5** - Type-safe JavaScript with strict mode enabled
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style variant)
- **Radix UI** - Headless UI primitives for accessibility
- **Lucide React** - Icon library
- **next-themes** - Dark/light theme support
- **Geist Font** - Typography (Sans & Mono variants)

## Flow Blockchain Integration
- **@onflow/fcl** - Flow Client Library for wallet connection and transactions
- **Flow Testnet/Mainnet** - Blockchain network configuration
- **IPFS via nft.storage** - Decentralized metadata storage

## Form Handling & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Development Tools
- **ESLint** - Code linting (build errors ignored in config)
- **PostCSS** - CSS processing
- **Vercel Analytics** - Performance monitoring

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Package Management
- Uses **pnpm** as package manager
- Lock file: `pnpm-lock.yaml`

## Configuration Notes
- TypeScript strict mode enabled
- ESLint and TypeScript errors ignored during builds (rapid prototyping setup)
- Images unoptimized for static export compatibility
- Path aliases configured: `@/*` maps to project root