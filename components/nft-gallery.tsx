"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Search, Filter, Grid3X3, Grid2X2, List, SortAsc, SortDesc, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useNFTTransfer } from "@/hooks/use-nft-transfer"
import { useNFTEvents, useEvents } from "@/lib/flow/event-context"
import { useEnhancedNFTCollection } from "@/hooks/use-enhanced-nft-collection"
import { useWallet } from "@/lib/wallet-context"

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

  // Enhanced collection integration
  const { address } = useWallet()
  const { handleTransferNFT, handleListNFTForSale, isTransferring, isListing } = useEnhancedNFTCollection()
  
  // Enhanced real-time event integration
  const { 
    galleryUpdateCount, 
    latestEvent: latestNFTEvent,
    onNFTMinted,
    onNFTTransferred,
    onNFTSold,
    onNFTListed
  } = useEvents()
  const [lastUpdateCount, setLastUpdateCount] = useState(0)
  const [realtimeNFTs, setRealtimeNFTs] = useState<EnrichedNFT[]>([])

  // Auto-refresh when real-time events occur
  useEffect(() => {
    if (galleryUpdateCount > lastUpdateCount && onRefresh) {
      console.log("[NFTGallery] Real-time update detected, refreshing gallery")
      onRefresh()
      setLastUpdateCount(galleryUpdateCount)
      
      // Show event-specific notification with enhanced context
      if (latestNFTEvent) {
        const eventType = latestNFTEvent.type
        const eventData = latestNFTEvent.data
        
        if (eventType.includes("MINTED") && eventData.recipient === address) {
          toast.success("New NFT minted in your collection!", {
            description: `NFT #${eventData.nftId} has been added to your gallery`,
            duration: 5000,
            action: {
              label: "View",
              onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = `/nft/${eventData.nftId}`
              }
            }
            }
          })
          // Trigger event handler
          onNFTMinted(eventData.nftId, eventData.recipient)
        } else if (eventType.includes("TRANSFERRED")) {
          if (eventData.to === address) {
            toast.success("NFT received!", {
              description: `NFT #${eventData.nftId} has been transferred to your collection`,
              duration: 5000
            })
          } else if (eventData.from === address) {
            toast.info("NFT transferred", {
              description: `NFT #${eventData.nftId} has been sent successfully`,
              duration: 4000
            })
          }
          // Trigger event handler
          onNFTTransferred(eventData.nftId, eventData.from, eventData.to)
        } else if (eventType.includes("SALE") && (eventData.buyer === address || eventData.seller === address)) {
          const isBuyer = eventData.buyer === address
          toast.success(isBuyer ? "NFT purchased!" : "NFT sold!", {
            description: `NFT #${eventData.nftId} ${isBuyer ? 'purchased' : 'sold'} for ${eventData.price} ${eventData.currency}`,
            duration: 6000
          })
          // Trigger event handler
          onNFTSold(eventData.nftId, eventData.seller, eventData.buyer, eventData.price)
        } else if (eventType.includes("LISTING") && eventData.seller === address) {
          toast.info("NFT listed for sale", {
            description: `NFT #${eventData.nftId} is now listed for ${eventData.price} ${eventData.currency}`,
            duration: 4000
          })
          // Trigger event handler
          onNFTListed(eventData.nftId, eventData.seller, eventData.price)
        }
      }
    }
  }, [galleryUpdateCount, lastUpdateCount, onRefresh, latestNFTEvent, address, onNFTMinted, onNFTTransferred, onNFTSold, onNFTListed])

  // Listen for real-time NFT events to show immediate updates
  useEffect(() => {
    const handleNFTEvent = (event: CustomEvent) => {
      const { eventType, data } = event.detail
      
      if (eventType === 'mint' && data.owner === address) {
        // Show optimistic update for minted NFT
        const optimisticNFT: EnrichedNFT = {
          id: data.nftId,
          name: `NFT #${data.nftId}`,
          description: "Recently minted NFT",
          image: "/placeholder.svg",
          metadata_url: "",
          owner: data.owner,
          creator: data.owner,
          collection_id: "ownly_collectibles",
          minted_at: new Date().toISOString(),
          transaction_hash: data.transactionId,
          rarity: "common",
          category: "digital_art"
        }
        
        setRealtimeNFTs(prev => [optimisticNFT, ...prev])
        
        // Remove optimistic update after refresh
        setTimeout(() => {
          setRealtimeNFTs(prev => prev.filter(nft => nft.id !== data.nftId))
        }, 5000)
      }
    }

    // Only add event listeners on client side
    if (typeof window !== 'undefined') {
      window.addEventListener("nft-event", handleNFTEvent as EventListener)
      return () => window.removeEventListener("nft-event", handleNFTEvent as EventListener)
    }
  }, [address])

  // Get unique categories from NFTs
  const categories = useMemo(() => {
    const cats = new Set(nfts.map(nft => nft.collection_id || 'uncategorized'))
    return ['all', ...Array.from(cats)]
  }, [nfts])

  // Filter and sort NFTs (including real-time optimistic updates)
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = [...realtimeNFTs, ...nfts]

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

  // Enhanced action handlers using the collection hook
  const handleTransferAction = async (nft: EnrichedNFT, recipientAddress: string) => {
    try {
      await handleTransferNFT(nft, recipientAddress)
      
      // Trigger refresh callback if provided
      if (onRefresh) {
        setTimeout(() => onRefresh(), 1000)
      }
    } catch (error) {
      console.error('Transfer failed:', error)
      throw error
    }
  }

  const handleListForSaleAction = async (nft: EnrichedNFT, price: number, currency: string, duration?: number) => {
    try {
      await handleListNFTForSale(nft, price, currency, duration)
      
      // Trigger refresh callback if provided
      if (onRefresh) {
        setTimeout(() => onRefresh(), 1000)
      }
    } catch (error) {
      console.error('Listing failed:', error)
      throw error
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
          <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
            {galleryUpdateCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {galleryUpdateCount}
              </Badge>
            )}
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
        onOpenChange={(open) => {
          if (!isTransferring && !isListing) {
            setShowTransferModal(open)
          }
        }}
        onTransfer={handleTransferAction}
      />

      <ListForSaleModal
        nft={selectedNFT}
        open={showListForSaleModal}
        onOpenChange={(open) => {
          if (!isTransferring && !isListing) {
            setShowListForSaleModal(open)
          }
        }}
        onListForSale={handleListForSaleAction}
        onListingComplete={() => {
          // Additional callback for listing completion
          if (onRefresh) {
            setTimeout(() => onRefresh(), 2000)
          }
        }}
      />
    </div>
  )
}