"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Filter,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface TransactionHistoryProps {
  transactions: Transaction[]
  loading?: boolean
  error?: string | null
  currentUserId?: string
  showFilters?: boolean
  maxHeight?: string
}

type TransactionFilter = 'all' | 'mint' | 'sale' | 'transfer' | 'offer'
type StatusFilter = 'all' | 'pending' | 'completed' | 'failed'

export function TransactionHistory({
  transactions,
  loading = false,
  error = null,
  currentUserId,
  showFilters = true,
  maxHeight = "400px"
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [transactions, typeFilter, statusFilter])

  const getTransactionIcon = (type: Transaction['type'], isOutgoing: boolean) => {
    switch (type) {
      case 'mint':
        return <Palette className="w-5 h-5 text-green-500" />
      case 'sale':
        return <ShoppingCart className="w-5 h-5 text-blue-500" />
      case 'transfer':
        return isOutgoing 
          ? <ArrowUpRight className="w-5 h-5 text-orange-500" />
          : <ArrowDownLeft className="w-5 h-5 text-green-500" />
      case 'offer':
        return <Send className="w-5 h-5 text-purple-500" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getTransactionDescription = (tx: Transaction, isCurrentUser: boolean) => {
    const isOutgoing = currentUserId === tx.from.id
    const otherUser = isOutgoing ? tx.to : tx.from

    switch (tx.type) {
      case 'mint':
        return `Minted by ${tx.from.displayName}`
      case 'sale':
        if (isCurrentUser) {
          return isOutgoing 
            ? `Sold to @${otherUser.username}`
            : `Bought from @${otherUser.username}`
        }
        return `Sold by @${tx.from.username} to @${tx.to.username}`
      case 'transfer':
        if (isCurrentUser) {
          return isOutgoing 
            ? `Transferred to @${otherUser.username}`
            : `Received from @${otherUser.username}`
        }
        return `Transferred from @${tx.from.username} to @${tx.to.username}`
      case 'offer':
        return `Offer from @${tx.from.username}`
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <Badge variant="secondary">
            {filteredTransactions.length} transactions
          </Badge>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-2 pt-4">
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionFilter)}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mint">Mint</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 px-6">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No transactions found</p>
            <p className="text-xs text-muted-foreground">
              {typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Your transaction history will appear here'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full" style={{ maxHeight }}>
            <div className="space-y-1 p-6 pt-0">
              {filteredTransactions.map((tx) => {
                const isCurrentUserInvolved = currentUserId === tx.from.id || currentUserId === tx.to.id
                const isOutgoing = currentUserId === tx.from.id

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* NFT Thumbnail */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={tx.nft.image || "/placeholder.svg"}
                        alt={tx.nft.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTransactionIcon(tx.type, isOutgoing)}
                        <span className="font-medium text-sm truncate">
                          {tx.nft.name}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="text-xs capitalize"
                        >
                          {tx.type}
                        </Badge>
                        {getStatusIcon(tx.status)}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1">
                        {getTransactionDescription(tx, isCurrentUserInvolved)}
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
                        <p className="font-medium text-sm">
                          {tx.price} {tx.currency}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}