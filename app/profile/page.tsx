"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NFTGallery } from "@/components/nft-gallery"
import { TransactionHistory } from "@/components/transaction-history"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useWallet } from "@/lib/wallet-context"
import { useUserCollection } from "@/hooks/use-user-collection"
import { useRealTimeNFTGallery } from "@/lib/flow/hooks"
import { mockTransactions } from "@/lib/mock-data"
import { Settings, Share2, Copy, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { isConnected, user, address } = useWallet()
  const [activeTab, setActiveTab] = useState("owned")
  const [copied, setCopied] = useState(false)

  const { 
    collection, 
    nfts, 
    loading: nftsLoading, 
    error: nftsError,
    refetch,
    clearCache 
  } = useUserCollection(address, {
    autoFetch: true,
    useCache: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  })

  // Real-time gallery updates
  const { 
    realTimeUpdates, 
    lastUpdate 
  } = useRealTimeNFTGallery()

  if (!isConnected || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center py-16">
              <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-8">You need to connect your wallet to view your profile</p>
              <Button size="lg">Connect Wallet</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const ownedNFTs = nfts
  const createdNFTs = nfts // For now, all owned NFTs are considered created
  const userTransactions = mockTransactions.filter((tx) => tx.from.id === user.id || tx.to.id === user.id)

  const handleRefresh = async () => {
    clearCache()
    await refetch()
    toast.success("Collection refreshed!")
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address || user.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="relative">
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-r from-foreground to-muted rounded-t-2xl" />

              {/* Profile Info */}
              <div className="relative px-6 pb-6 bg-card border-2 border-border rounded-b-2xl -mt-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                  <Avatar className="w-32 h-32 border-4 border-background">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                    <AvatarFallback className="text-3xl">{user.username[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 pt-16 sm:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h1 className="text-3xl font-bold">{user.username}</h1>
                          {user.verified && <Badge variant="secondary">Verified</Badge>}
                        </div>
                        <p className="text-muted-foreground">@{user.username}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm mb-4">{user.bio}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <code className="text-xs bg-muted px-3 py-1.5 rounded">{address || user.address}</code>
                      <Button variant="ghost" size="sm" onClick={copyAddress}>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="font-bold">{collection?.totalNFTs || 0}</span>
                        <span className="text-muted-foreground ml-1">Owned</span>
                      </div>
                      <div>
                        <span className="font-bold">{createdNFTs.length}</span>
                        <span className="text-muted-foreground ml-1">Created</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Joined {new Date(user.joinedDate).toLocaleDateString()}
                        </span>
                      </div>
                      {collection?.hasCollection === false && (
                        <Badge variant="outline" className="text-xs">
                          Collection Not Set Up
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-8">
                <TabsList className="justify-start">
                  <TabsTrigger value="owned">Owned ({collection?.totalNFTs || 0})</TabsTrigger>
                  <TabsTrigger value="created">Created ({createdNFTs.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity ({userTransactions.length})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  {realTimeUpdates > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {realTimeUpdates} live updates
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={nftsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${nftsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              <TabsContent value="owned">
                <NFTGallery
                  nfts={ownedNFTs}
                  loading={nftsLoading}
                  error={nftsError}
                  onRefresh={handleRefresh}
                  showFilters={true}
                  showSearch={true}
                  showViewToggle={true}
                  showActions={true}
                  emptyStateConfig={{
                    title: "No NFTs in Your Collection",
                    description: "You don't own any NFTs yet. Start building your collection by exploring the marketplace or creating your first NFT.",
                    actionText: "Browse Marketplace",
                    actionHref: "/marketplace"
                  }}
                />
              </TabsContent>

              <TabsContent value="created">
                <NFTGallery
                  nfts={createdNFTs}
                  loading={nftsLoading}
                  error={nftsError}
                  onRefresh={handleRefresh}
                  showFilters={true}
                  showSearch={true}
                  showViewToggle={true}
                  emptyStateConfig={{
                    title: "No NFTs Created",
                    description: "You haven't created any NFTs yet. Start your creative journey by minting your first digital collectible.",
                    actionText: "Create Your First NFT",
                    actionHref: "/mint"
                  }}
                />
              </TabsContent>

              <TabsContent value="activity">
                <TransactionHistory
                  transactions={userTransactions}
                  loading={false}
                  currentUserId={user.id}
                  showFilters={true}
                  maxHeight="600px"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
