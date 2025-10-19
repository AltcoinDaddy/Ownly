"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  AlertTriangle 
} from "lucide-react"

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface TransactionDetails {
  type: 'buy' | 'sell' | 'list' | 'transfer'
  nftName?: string
  nftId?: string
  price?: number
  currency?: string
  fromAddress?: string
  toAddress?: string
  transactionHash?: string
  status: TransactionStatus
  error?: string
}

interface TransactionConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionDetails | null
  onRetry?: () => void
}

export function TransactionConfirmation({
  open,
  onOpenChange,
  transaction,
  onRetry
}: TransactionConfirmationProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!transaction || transaction.status !== 'processing') {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 500)

    return () => clearInterval(interval)
  }, [transaction?.status])

  useEffect(() => {
    if (transaction?.status === 'completed') {
      setProgress(100)
    } else if (transaction?.status === 'failed') {
      setProgress(0)
    }
  }, [transaction?.status])

  if (!transaction) return null

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />
      case 'processing':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
    }
  }

  const getStatusMessage = () => {
    switch (transaction.status) {
      case 'pending':
        return 'Transaction initiated'
      case 'processing':
        return 'Processing on blockchain...'
      case 'completed':
        return 'Transaction completed successfully!'
      case 'failed':
        return 'Transaction failed'
    }
  }

  const getTransactionTitle = () => {
    switch (transaction.type) {
      case 'buy':
        return 'Purchase NFT'
      case 'sell':
        return 'Sell NFT'
      case 'list':
        return 'List NFT for Sale'
      case 'transfer':
        return 'Transfer NFT'
    }
  }

  const canClose = transaction.status === 'completed' || transaction.status === 'failed'
  const canRetry = transaction.status === 'failed' && onRetry

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent className="max-w-md" hideCloseButton={!canClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getTransactionTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={`capitalize ${getStatusColor()}`}>
              {transaction.status}
            </Badge>
          </div>

          {/* Progress Bar for Processing */}
          {transaction.status === 'processing' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {/* Status Message */}
          <div className="text-center">
            <p className="font-medium">{getStatusMessage()}</p>
            {transaction.status === 'processing' && (
              <p className="text-sm text-muted-foreground mt-1">
                This may take a few moments...
              </p>
            )}
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="space-y-2">
            {transaction.nftName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">NFT</span>
                <span className="text-sm font-medium">{transaction.nftName}</span>
              </div>
            )}

            {transaction.nftId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">NFT ID</span>
                <span className="text-sm font-mono">#{transaction.nftId}</span>
              </div>
            )}

            {transaction.price && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-medium">
                  {transaction.price} {transaction.currency}
                </span>
              </div>
            )}

            {transaction.fromAddress && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm font-mono">
                  {transaction.fromAddress.slice(0, 6)}...{transaction.fromAddress.slice(-4)}
                </span>
              </div>
            )}

            {transaction.toAddress && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-mono">
                  {transaction.toAddress.slice(0, 6)}...{transaction.toAddress.slice(-4)}
                </span>
              </div>
            )}

            {transaction.transactionHash && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transaction</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-sm"
                  onClick={() => {
                    // Open Flow blockchain explorer
                    const explorerUrl = `https://flowscan.org/transaction/${transaction.transactionHash}`
                    window.open(explorerUrl, '_blank')
                  }}
                >
                  <span className="font-mono">
                    {transaction.transactionHash.slice(0, 6)}...{transaction.transactionHash.slice(-4)}
                  </span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {transaction.status === 'failed' && transaction.error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Transaction Failed</p>
                <p className="mt-1">{transaction.error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canClose && (
            <div className="flex gap-2">
              {canRetry && (
                <Button
                  variant="outline"
                  onClick={onRetry}
                  className="flex-1"
                >
                  Try Again
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1"
                variant={transaction.status === 'completed' ? 'default' : 'outline'}
              >
                {transaction.status === 'completed' ? 'Done' : 'Close'}
              </Button>
            </div>
          )}

          {/* Processing State - No Actions */}
          {(transaction.status === 'pending' || transaction.status === 'processing') && (
            <div className="text-center text-sm text-muted-foreground">
              Please wait while the transaction is processed...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}