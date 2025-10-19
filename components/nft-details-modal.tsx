"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { EnrichedNFT } from "@/lib/flow/collection-service"
import { 
  ExternalLink, 
  Copy, 
  Share2, 
  Send,
  Tag,
  Calendar,
  Hash,
  User,
  Palette,
  Globe,
  ChevronRight,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface NFTDetailsModalProps {
  nft: EnrichedNFT | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransfer?: (nft: EnrichedNFT) => void
  onListForSale?: (nft: EnrichedNFT) => void
  showActions?: boolean
}

export function NFTDetailsModal({
  nft,
  open,
  onOpenChange,
  onTransfer,
  onListForSale,
  showActions = true
}: NFTDetailsModalProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  if (!nft) return null

  const copyTokenId = () => {
    navigator.clipboard.writeText(nft.id)
    toast.success("Token ID copied to clipboard")
  }

  const copyAddress = (address: string, label: string) => {
    navigator.clipboard.writeText(address)
    toast.success(`${label} address copied to clipboard`)
  }

  const shareNFT = () => {
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: nft.description,
        url: `/nft/${nft.id}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/nft/${nft.id}`)
      toast.success("Link copied to clipboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Image Section */}
          <div className="relative bg-muted">
            <div className="aspect-square relative">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <Image
                src={!imageError ? (nft.image || nft.thumbnail || "/placeholder.svg") : "/placeholder.svg"}
                alt={nft.name}
                fill
                className="object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
              />
            </div>
            
            {/* Image overlay actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="secondary" size="sm" onClick={shareNFT}>
                <Share2 className="w-4 h-4" />
              </Button>
              {nft.external_url && (
                <Button variant="secondary" size="sm" asChild>
                  <a href={nft.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-bold mb-2 line-clamp-2">
                    {nft.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{nft.collection_id}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTokenId}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      #{nft.id}
                      <Copy className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Description */}
                  {nft.description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Description</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {nft.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Creator & Owner Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Ownership</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Owner</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAddress(nft.owner, "Owner")}
                          className="text-sm font-mono"
                        >
                          {nft.owner.slice(0, 8)}...{nft.owner.slice(-6)}
                          <Copy className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                      
                      {nft.creator && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Creator</span>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-xs">{nft.creator[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{nft.creator}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {nft.minted_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Minted</span>
                          <span className="text-sm">
                            {new Date(nft.minted_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Token ID</span>
                        <span className="text-sm font-mono">#{nft.id}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Collection</span>
                        <Badge variant="outline" className="text-xs">
                          {nft.collection_id}
                        </Badge>
                      </div>

                      {nft.metadata_url && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Metadata</span>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={nft.metadata_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="attributes" className="space-y-4 mt-4">
                  {nft.attributes && nft.attributes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {nft.attributes.map((attr, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{attr.trait_type}</p>
                                <p className="text-xs text-muted-foreground">Trait</p>
                              </div>
                              <Badge variant="secondary">{attr.value}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Palette className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No attributes available</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Additional traits from Flow metadata */}
                  {nft.traits && Object.keys(nft.traits).length > 0 && (
                    <div className="space-y-3">
                      <Separator />
                      <h4 className="text-sm font-medium">Additional Traits</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(nft.traits).map(([key, value], index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{key}</p>
                                  <p className="text-xs text-muted-foreground">Property</p>
                                </div>
                                <Badge variant="outline">{String(value)}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">Transaction History</p>
                      <p className="text-xs text-muted-foreground">
                        Transaction history will be available in a future update
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Action Buttons */}
            {showActions && (
              <div className="p-6 pt-4 border-t border-border">
                <div className="flex gap-3">
                  {onTransfer && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onTransfer(nft)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Transfer
                    </Button>
                  )}
                  {onListForSale && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onListForSale(nft)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      List for Sale
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={shareNFT}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}