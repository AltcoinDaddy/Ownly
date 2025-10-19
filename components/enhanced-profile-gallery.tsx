"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/wallet-context"
import { useEnhancedNFTCollection } from "@/hooks/use-enhanced-nft-collection"
import { NFTGallery } from "./nft-gallery"
import { EnhancedRealTimeIntegration } from "./enhanced-real-time-integration"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Wallet, 
  TrendingUp, 
  RefreshCw, 
  BarChart3,
  Calendar,
  Hash,
  Palette
} from "lucide-react"
import { toast } from "sonner"

interface EnhancedProfileGalleryProps {
  className?: string
}

export function EnhancedProfileGallery({ className }: EnhancedProfileGalleryProps) {
  const { address, isConnected } = useWallet()
  const {
    collection,
    loading,
    error,
    total,
    lastUpdated,
    userProfile,
    refreshCollection,
    getCollectionStats,
    searchNFTs,
    refreshCount
  } = useEnhancedNFTCollection()

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredNFTs, setFilteredNFTs] = useState(collection)

  // Update filtered NFTs when collection or search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredNFTs(searchNFTs(searchQuery))
    } else {
      setFilteredNFTs(collection)
    }
  }, [collection, searchQuery, searchNFTs])

  // Get collection statistics
  const stats = getCollectionStats()

  const handleRefresh = () => {
    refreshCollection()
    toast.info("Refreshing collection...", {
      description: "Fetching latest data from the blockchain",
      duration: 2000
    })
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-muted-foreground mb-4">
          Connect your Flow wallet to view your NFT collection
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Your Collection</h1>
                  <p className="text-muted-foreground font-mono text-sm">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                  {refreshCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {refreshCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalNFTs}</p>
                  <p className="text-xs text-muted-foreground">Total NFTs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.collections.length}</p>
                  <p className="text-xs text-muted-foreground">Collections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.creators.length}</p>
                  <p className="text-xs text-muted-foreground">Creators</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats.estimatedValue > 0 ? `${stats.estimatedValue.toFixed(2)}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Est. Value (FLOW)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Integration */}
        <EnhancedRealTimeIntegration
          onGalleryUpdate={refreshCollection}
          showNotifications={true}
          showIndicator={true}
          autoRefresh={true}
        />

        {/* Collection Tabs */}
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4">
            <NFTGallery
              nfts={filteredNFTs}
              loading={loading}
              error={error}
              onRefresh={refreshCollection}
              showFilters={true}
              showSearch={true}
              showViewToggle={true}
              showActions={true}
              emptyStateConfig={{
                title: "No NFTs in your collection",
                description: "Start building your collection by minting or purchasing NFTs",
                actionText: "Explore Marketplace",
                actionHref: "/marketplace"
              }}
            />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.collections.map(({ id, count }) => (
                <Card key={id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {count} NFT{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Collection Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profile created</span>
                    <span className="text-sm">
                      {userProfile?.joined_at 
                        ? new Date(userProfile.joined_at).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">NFTs owned</span>
                    <span className="text-sm font-medium">{userProfile?.nfts_owned || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">NFTs created</span>
                    <span className="text-sm font-medium">{userProfile?.nfts_created || 0}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last sync</span>
                    <span className="text-sm">
                      {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}