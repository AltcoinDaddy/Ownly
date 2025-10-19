"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { transactionService } from "@/lib/flow/transaction-service"
import type { Transaction } from "@/lib/types"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Palette, 
  ShoppingCart, 
  Send, 
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface NFTTransactionHistoryProps {
  nftId: string
  maxHeight?: string
}

export function NFTTransactionHistory({
  nftId,
  maxHeight = "300px"
}: NFTTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const nftTransactions = await transactionService.getNFTTransactions(nftId, 20)
      setTransactions(nftTransactions)
    } catch (err) {
      console.error('Failed to fetch NFT transactions:', err)
      setError('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (nftId) {
      fetchTransactions()
    }
  }, [nftId])

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'mint':
        return <Palette className="w-4 h-4 text-green-500" />
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />
      case 'transfer':
        return <Send className="w-4 h-4 text-orange-500" />
      case 'offer':
        return <ArrowUpRight className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case 'mint':
        return `Minted by ${tx.from.displayName}`
      case 'sale':
        return `Sold by ${tx.from.displayName} to ${tx.to.displayName}`
      case 'transfer':
        return `Transferred from ${tx.from.displayName} to ${tx.to.displayName}`
      case 'offer':
        return `Offer from ${tx.from.displayName}`
      default:
        return 'Unknown transaction'
    }
  }

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash)
    toast.success("Transaction hash copied to clipboard")
  }

  const openBlockExplorer = (txHash: string) => {
    // TODO: Replace with actual Flow block explorer URL
    const explorerUrl = `https://flowscan.org/transaction/${txHash}`
    window.open(explorerUrl, '_blank')
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">No Transaction History</p>
          <p className="text-xs text-muted-foreground">
            This NFT doesn't have any recorded transactions yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Transaction History</p>
        <Button variant="ghost" size="sm" onClick={fetchTransactions}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <Card key={tx.id} className="p-3">
              <div className="flex items-center gap-3">
                {/* Transaction Icon */}
                <div className="flex-shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {tx.type}
                    </Badge>
                    {getStatusIcon(tx.status)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-1">
                    {getTransactionDescription(tx)}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                    <span>•</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyTxHash(tx.txHash)}
                    >
                      {tx.txHash.slice(0, 8)}...
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => openBlockExplorer(tx.txHash)}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  {tx.price && (
                    <p className="text-xs font-medium">
                      {tx.price} {tx.currency}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}