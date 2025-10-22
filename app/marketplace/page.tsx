"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MarketplaceNFTCard } from "@/components/marketplace-nft-card"
import { BuyNFTModal } from "@/components/buy-nft-modal"
import { TransactionConfirmation, TransactionDetails } from "@/components/transaction-confirmation"
import { RealTimeMarketplace } from "@/components/real-time-marketplace"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/lib/wallet-context"
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction"
import { useRealTimeMarketplace } from "@/lib/flow/hooks"
import { Search, RefreshCw, Filter, Activity } from "lucide-react"

interface MarketplaceListing {
  listing_id: string
  nft_id: string
  price: number
  currency: 'FLOW'
  seller: string
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  nft_metadata?: {
    name: string
    description: string
    image: string
    metadata_url: string
    collection_id: string
    creator: string
  }
}

export default function MarketplacePage() {
  const { user } = useWallet()
  const { toast } = useToast()
  const marketplaceTransaction = useMarketplaceTransaction()
  
  // Real-time marketplace updates
  const { marketplaceUpdates, lastUpdate } = useRealTimeMarketplace()
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("active")
  const [sortBy, setSortBy] = useState("recent")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [showRealTimePanel, setShowRealTimePanel] = useState(false)

  // Data state
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Modal state
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState<TransactionDetails | null>(null)

  const categories = ["all", "ownly_collectibles", "Art", "Photography", "Digital Art", "3D", "Music"]
  const statuses = ["all", "active", "sold", "cancelled"]

  // Fetch marketplace listings
  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (minPrice) params.append("minPrice", minPrice)
      if (maxPrice) params.append("maxPrice", maxPrice)
      params.append("sortBy", sortBy === "recent" ? "created_at" : sortBy.replace("-", "_"))
      params.append("sortOrder", sortBy.includes("high") ? "desc" : "asc")

      const response = await fetch(`/api/marketplace?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch marketplace listings')
      }

      const data = await response.json()
      setListings(data.listings || [])
    } catch (err) {
      console.error('Error fetching listings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load marketplace')
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [selectedCategory, selectedStatus, sortBy, minPrice, maxPrice])

  // Auto-refresh when real-time marketplace updates occur
  useEffect(() => {
    if (marketplaceUpdates > 0 && lastUpdate) {
      const timeSinceLastRefresh = new Date().getTime() - lastRefresh.getTime()
      
      // Auto-refresh if it's been more than 30 seconds since last refresh
      if (timeSinceLastRefresh > 30000) {
        console.log("[MarketplacePage] Auto-refreshing due to real-time updates")
        fetchListings()
        setLastRefresh(new Date())
      }
    }
  }, [marketplaceUpdates, lastUpdate, lastRefresh])

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    const name = listing.nft_metadata?.name?.toLowerCase() || ""
    const description = listing.nft_metadata?.description?.toLowerCase() || ""
    const nftId = listing.nft_id.toLowerCase()
    
    return name.includes(searchLower) || 
           description.includes(searchLower) || 
           nftId.includes(searchLower)
  })

  // Handle buy NFT
  const handleBuyNFT = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setShowBuyModal(true)
  }

  // Handle view details
  const handleViewDetails = (listing: MarketplaceListing) => {
    // Navigate to NFT details page or show details modal
    if (typeof window !== 'undefined') {
      window.open(`/nft/${listing.nft_id}`, '_blank')
    }
  }

  // Handle purchase transaction
  const handlePurchase = async (listingId: string) => {
    if (!user?.addr || !selectedListing) {
      throw new Error("Wallet not connected")
    }

    // Start transaction
    const transaction: TransactionDetails = {
      type: 'buy',
      nftName: selectedListing.nft_metadata?.name,
      nftId: selectedListing.nft_id,
      price: selectedListing.price,
      currency: selectedListing.currency,
      fromAddress: selectedListing.seller,
      toAddress: user.addr,
      status: 'pending'
    }

    setCurrentTransaction(transaction)
    setShowBuyModal(false)
    setShowTransactionModal(true)

    try {
      // Update to processing
      setCurrentTransaction(prev => prev ? { ...prev, status: 'processing' } : null)

      // Use Flow marketplace transaction hook for direct blockchain interaction
      const transactionId = await marketplaceTransaction.purchaseNFT(
        selectedListing.nft_id,
        selectedListing.seller,
        selectedListing.price
      )
      
      // Update to completed
      setCurrentTransaction(prev => prev ? {
        ...prev,
        status: 'completed',
        transactionHash: transactionId
      } : null)

      // Refresh listings
      fetchListings()

    } catch (error) {
      console.error('Purchase failed:', error)
      setCurrentTransaction(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Purchase failed'
      } : null)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchListings()
    setLastRefresh(new Date())
  }

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedStatus("active")
    setMinPrice("")
    setMaxPrice("")
    setSortBy("recent")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
                  NFT Marketplace
                  {marketplaceUpdates > 0 && (
                    <Badge className="ml-3 bg-green-500/10 text-green-500 border-green-500/20">
                      {marketplaceUpdates} Live Updates
                    </Badge>
                  )}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl text-balance">
                  Discover, buy, and sell unique digital collectibles on Flow blockchain
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRealTimePanel(!showRealTimePanel)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Live Activity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search NFTs, creators, or NFT IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Listed</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status === "all" ? "All Status" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range */}
              <Input
                placeholder="Min Price (FLOW)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
              <Input
                placeholder="Max Price (FLOW)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedCategory !== "all" || selectedStatus !== "active" || minPrice || maxPrice) && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Real-time Activity Panel */}
          {showRealTimePanel && (
            <div className="mb-8">
              <RealTimeMarketplace 
                onRefreshMarketplace={handleRefresh}
                className="max-w-2xl mx-auto"
              />
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                "Loading listings..."
              ) : (
                <>
                  Showing {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
                  {lastUpdate && (
                    <span className="ml-2 text-xs">
                      • Last updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </>
              )}
            </p>
            {!user?.addr && (
              <p className="text-sm text-muted-foreground">
                Connect your wallet to purchase NFTs
              </p>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* NFT Grid */}
          {!loading && !error && filteredListings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <MarketplaceNFTCard
                  key={listing.listing_id}
                  listing={listing}
                  onBuy={handleBuyNFT}
                  onViewDetails={handleViewDetails}
                  userAddress={user?.addr}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                {listings.length === 0 
                  ? "No NFTs are currently listed for sale"
                  : "No listings found matching your criteria"
                }
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <BuyNFTModal
        listing={selectedListing}
        open={showBuyModal}
        onOpenChange={setShowBuyModal}
        onPurchase={handlePurchase}
        userAddress={user?.addr}
      />

      <TransactionConfirmation
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        transaction={currentTransaction}
        onRetry={() => {
          if (selectedListing) {
            handlePurchase(selectedListing.listing_id)
          }
        }}
      />
    </div>
  )
}
