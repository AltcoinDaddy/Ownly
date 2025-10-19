"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedNFTCard } from "./enhanced-nft-card"
import { EmptyGalleryState } from "./empty-gallery-state"
import { NFTDetailsModal } from "./nft-details-modal"
import { TransferNFTModal } from "./transfer-nft-modal"
import { ListForSaleModal } from "./list-for-sale-modal"
import type { EnrichedNFT } from "@/lib/flow/collection-service"
import { Search, Filter, Grid3X3, Grid2X2, List, SortAsc, SortDesc } from "lucide-react"
import { toast } from "sonner"

interface NFTGalleryProps {
  nfts: EnrichedNFT[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  showFilters?: boolean
  showSearch?: boolean
  showViewToggle?: boolean
  showActions?: boolean
  emptyStateConfig?: {
    title?: string
    description?: string
    actionText?: string
    actionHref?: string
  }
}

type SortOption = 'name' | 'minted_at' | 'id'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid-large' | 'grid-small' | 'list'

export function NFTGallery({
  nfts,
  loading = false,
  error = null,
  onRefresh,
  showFilters = true,
  showSearch = true,
  showViewToggle = true,
  showActions = false,
  emptyStateConfig
}: NFTGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>('minted_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid-large')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Modal states
  const [selectedNFT, setSelectedNFT] = useState<EnrichedNFT | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showListForSaleModal, setShowListForSaleModal] = useState(false)

  // Get unique categories from NFTs
  const categories = useMemo(() => {
    const cats = new Set(nfts.map(nft => nft.collection_id || 'uncategorized'))
    return ['all', ...Array.from(cats)]
  }, [nfts])

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = nfts

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(query) ||
        nft.description.toLowerCase().includes(query) ||
        nft.id.includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(nft => 
        (nft.collection_id || 'uncategorized') === selectedCategory
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'minted_at':
          aValue = new Date(a.minted_at || '').getTime() || 0
          bValue = new Date(b.minted_at || '').getTime() || 0
          break
        case 'id':
          aValue = parseInt(a.id) || 0
          bValue = parseInt(b.id) || 0
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [nfts, searchQuery, selectedCategory, sortBy, sortDirection])

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  // Modal handlers
  const handleViewDetails = (nft: EnrichedNFT) => {
    setSelectedNFT(nft)
    setShowDetailsModal(true)
  }

  const handleTransfer = (nft: EnrichedNFT) => {
    setSelectedNFT(nft)
    setShowTransferModal(true)
  }

  const handleListForSale = (nft: EnrichedNFT) => {
    setSelectedNFT(nft)
    setShowListForSaleModal(true)
  }

  // Action handlers
  const handleTransferNFT = async (nft: EnrichedNFT, recipientAddress: string) => {
    try {
      // TODO: Implement actual transfer logic with Flow transactions
      console.log('Transferring NFT:', nft.id, 'to:', recipientAddress)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`NFT "${nft.name}" transfer initiated to ${recipientAddress.slice(0, 8)}...`)
      
      // Refresh the collection after transfer
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Transfer failed:', error)
      throw new Error('Failed to transfer NFT. Please try again.')
    }
  }

  const handleListNFTForSale = async (nft: EnrichedNFT, price: number, currency: string, duration?: number) => {
    try {
      // TODO: Implement actual listing logic with Flow marketplace transactions
      console.log('Listing NFT for sale:', nft.id, 'price:', price, currency, 'duration:', duration)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`NFT "${nft.name}" listed for sale at ${price} ${currency}`)
      
      // Refresh the collection after listing
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Listing failed:', error)
      throw new Error('Failed to list NFT for sale. Please try again.')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="text-destructive text-lg font-semibold">Error Loading NFTs</div>
          <p className="text-muted-foreground">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Empty state
  if (nfts.length === 0) {
    return (
      <EmptyGalleryState
        title={emptyStateConfig?.title}
        description={emptyStateConfig?.description}
        actionText={emptyStateConfig?.actionText}
        actionHref={emptyStateConfig?.actionHref}
      />
    )
  }

  // No results after filtering
  if (filteredAndSortedNFTs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search NFTs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minted_at">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="id">Token ID</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
                title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>

            {showViewToggle && (
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid-large' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid-large')}
                  className="px-2"
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid-small' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid-small')}
                  className="px-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* No results message */}
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-lg font-semibold">No NFTs Found</div>
            <p className="text-muted-foreground">
              {searchQuery ? `No NFTs match "${searchQuery}"` : 'No NFTs match your current filters'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Grid layout classes
  const gridClasses = {
    'grid-large': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    'grid-small': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
    'list': 'space-y-4'
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minted_at">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="id">Token ID</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortDirection}
              title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>

          {showViewToggle && (
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid-large' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid-large')}
                className="px-2"
              >
                <Grid2X2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid-small' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid-small')}
                className="px-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedNFTs.length} of {nfts.length} NFTs
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      {/* NFT Grid */}
      <div className={gridClasses[viewMode]}>
        {filteredAndSortedNFTs.map((nft) => (
          <EnhancedNFTCard
            key={nft.id}
            nft={nft}
            viewMode={viewMode}
            showActions={showActions}
            onViewDetails={handleViewDetails}
            onTransfer={showActions ? handleTransfer : undefined}
            onListForSale={showActions ? handleListForSale : undefined}
          />
        ))}
      </div>

      {/* Modals */}
      <NFTDetailsModal
        nft={selectedNFT}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        showActions={showActions}
        onTransfer={showActions ? handleTransfer : undefined}
        onListForSale={showActions ? handleListForSale : undefined}
      />

      <TransferNFTModal
        nft={selectedNFT}
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        onTransfer={handleTransferNFT}
      />

      <ListForSaleModal
        nft={selectedNFT}
        open={showListForSaleModal}
        onOpenChange={setShowListForSaleModal}
        onListForSale={handleListNFTForSale}
      />
    </div>
  )
}