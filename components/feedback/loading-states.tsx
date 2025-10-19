'use client'

import React from 'react'
import { Loader2, Wallet, Upload, ShoppingCart, Send, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface LoadingStateProps {
  type: 'wallet' | 'transaction' | 'upload' | 'purchase' | 'transfer' | 'mint' | 'generic'
  message?: string
  progress?: number
  className?: string
}

export function LoadingState({ type, message, progress, className }: LoadingStateProps) {
  const config = getLoadingConfig(type)
  
  return (
    <div className={cn('flex flex-col items-center justify-center p-6', className)}>
      <div className="relative">
        <config.icon className={cn(
          'h-8 w-8 animate-spin text-primary',
          config.iconClass
        )} />
        {config.overlay && (
          <config.overlay className="absolute inset-0 h-8 w-8 text-primary/30" />
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-foreground">
          {message || config.defaultMessage}
        </p>
        
        {progress !== undefined && (
          <div className="mt-3 w-48">
            <Progress value={progress} className="h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
        
        {config.subMessage && (
          <p className="mt-2 text-xs text-muted-foreground">
            {config.subMessage}
          </p>
        )}
      </div>
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  type: LoadingStateProps['type']
  message?: string
  progress?: number
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({ 
  isLoading, 
  type, 
  message, 
  progress, 
  children, 
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-auto">
            <CardContent className="p-0">
              <LoadingState 
                type={type} 
                message={message} 
                progress={progress}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

interface InlineLoadingProps {
  type: LoadingStateProps['type']
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InlineLoading({ type, message, size = 'md', className }: InlineLoadingProps) {
  const config = getLoadingConfig(type)
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <config.icon className={cn(
        'animate-spin text-primary',
        sizeClasses[size]
      )} />
      {message && (
        <span className="text-sm text-muted-foreground">
          {message}
        </span>
      )}
    </div>
  )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({ 
  isLoading, 
  loadingText, 
  children, 
  disabled,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  )
}

// Skeleton components for loading states
export function NFTCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
          <div className="flex justify-between items-center">
            <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GallerySkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <NFTCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 bg-muted animate-pulse rounded-full" />
        <div className="space-y-2">
          <div className="h-6 bg-muted animate-pulse rounded w-48" />
          <div className="h-4 bg-muted animate-pulse rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-muted animate-pulse rounded w-16 mx-auto" />
            <div className="h-4 bg-muted animate-pulse rounded w-20 mx-auto mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Configuration for different loading types
function getLoadingConfig(type: LoadingStateProps['type']) {
  const configs = {
    wallet: {
      icon: Wallet,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Connecting to wallet...',
      subMessage: 'Please approve the connection in your wallet'
    },
    transaction: {
      icon: Loader2,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Processing transaction...',
      subMessage: 'This may take a few moments'
    },
    upload: {
      icon: Upload,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Uploading to IPFS...',
      subMessage: 'Storing your file on the decentralized web'
    },
    purchase: {
      icon: ShoppingCart,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Processing purchase...',
      subMessage: 'Completing your NFT purchase'
    },
    transfer: {
      icon: Send,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Transferring NFT...',
      subMessage: 'Sending to recipient address'
    },
    mint: {
      icon: Coins,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Minting NFT...',
      subMessage: 'Creating your digital collectible'
    },
    generic: {
      icon: Loader2,
      iconClass: '',
      overlay: undefined,
      defaultMessage: 'Loading...',
      subMessage: undefined
    }
  }

  return configs[type] || configs.generic
}