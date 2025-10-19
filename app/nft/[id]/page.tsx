"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/lib/wallet-context"
import { mockNFTs, mockTransactions } from "@/lib/mock-data"
import { Heart, Share2, Eye, ExternalLink, ShoppingCart, Tag, Clock, Loader2 } from "lucide-react"
import { buyNFT, listNFTForSale } from "@/lib/flow/marketplace"
import { toast } from "sonner"

export default function NFTDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, user, address } = useWallet()
  const [isLiked, setIsLiked] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isListing, setIsListing] = useState(false)

  const nft = mockNFTs.find((n) => n.id === params.id)

  if (!nft) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center py-16">
              <h1 className="text-4xl font-bold mb-4">NFT Not Found</h1>
              <p className="text-muted-foreground mb-8">The NFT you're looking for doesn't exist</p>
              <Button onClick={() => router.push("/marketplace")}>Browse Marketplace</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isOwner = address === nft.owner.address || user?.id === nft.owner.id
  const nftTransactions = mockTransactions.filter((tx) => tx.nft.id === nft.id)

  const rarityColors = {
    common: "bg-muted text-muted-foreground",
    rare: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    epic: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    legendary: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  }

  const handlePurchase = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsPurchasing(true)

    try {
      // This would use the actual listing ID and storefront address
      const listingId = "1" // Would come from marketplace data
      const storefrontAddress = nft.owner.address

      await buyNFT(listingId, storefrontAddress)

      toast.success("Purchase successful! NFT added to your collection")
      router.push("/profile")
    } catch (error) {
      console.error("[v0] Purchase error:", error)
      toast.error("Failed to purchase NFT. Please try again.")
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleListForSale = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsListing(true)

    try {
      await listNFTForSale(nft.tokenId, nft.price)
      toast.success("NFT listed for sale!")
    } catch (error) {
      console.error("[v0] Listing error:", error)
      toast.error("Failed to list NFT. Please try again.")
    } finally {
      setIsListing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Image */}
              <div className="space-y-6">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-border">
                  <Image src={nft.image || "/placeholder.svg"} alt={nft.title} fill className="object-cover" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{nft.views}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Heart className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{nft.likes}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Tag className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{nft.royalty}%</p>
                      <p className="text-xs text-muted-foreground">Royalty</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{nft.category}</Badge>
                    <Badge className={`capitalize ${rarityColors[nft.rarity]}`}>{nft.rarity}</Badge>
                  </div>

                  <h1 className="text-4xl font-bold mb-4 text-balance">{nft.title}</h1>

                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => setIsLiked(!isLiked)}>
                      <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                      {isLiked ? nft.likes + 1 : nft.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Creator & Owner */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">Creator</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={nft.creator.avatar || "/placeholder.svg"} alt={nft.creator.name} />
                          <AvatarFallback>{nft.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{nft.creator.name}</p>
                          <p className="text-xs text-muted-foreground">@{nft.creator.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">Owner</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={nft.owner.avatar || "/placeholder.svg"} alt={nft.owner.name} />
                          <AvatarFallback>{nft.owner.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{nft.owner.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{nft.owner.address.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Price & Purchase */}
                <Card className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                        <p className="text-3xl font-bold">{nft.price} FLOW</p>
                      </div>
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>

                    {isOwner ? (
                      <div className="space-y-2">
                        <Button className="w-full" size="lg" disabled>
                          You Own This NFT
                        </Button>
                        <Button
                          className="w-full bg-transparent"
                          variant="outline"
                          size="lg"
                          onClick={handleListForSale}
                          disabled={isListing}
                        >
                          {isListing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Listing...
                            </>
                          ) : (
                            "List for Sale"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button className="w-full" size="lg" onClick={handlePurchase} disabled={isPurchasing}>
                          {isPurchasing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Buy Now
                            </>
                          )}
                        </Button>
                        <Button className="w-full bg-transparent" variant="outline" size="lg">
                          Make Offer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">
                      History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{nft.description}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Properties</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Token ID</span>
                          <span className="font-mono">{nft.tokenId}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Blockchain</span>
                          <span className="font-medium">{nft.blockchain}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Contract</span>
                          <span className="font-mono text-xs">{nft.contractAddress.slice(0, 12)}...</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Minted</span>
                          <span>{new Date(nft.mintDate).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Creator Royalty</span>
                          <span>{nft.royalty}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Button variant="outline" className="w-full bg-transparent">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Flow Blockchain
                    </Button>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4 mt-4">
                    {nftTransactions.length > 0 ? (
                      nftTransactions.map((tx) => (
                        <Card key={tx.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge variant="secondary" className="capitalize mb-2">
                                  {tx.type}
                                </Badge>
                                <p className="text-sm">
                                  From <span className="font-medium">@{tx.from.username}</span> to{" "}
                                  <span className="font-medium">@{tx.to.username}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                {tx.price && (
                                  <p className="font-bold mb-1">
                                    {tx.price} {tx.currency}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">No transaction history yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
