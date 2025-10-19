"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { EnrichedNFT } from "@/lib/flow/collection-service"
import { 
  ExternalLink, 
  Copy, 
  Share2, 
  MoreHorizontal,
  Calendar,
  Hash,
  User,
  Palette
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface EnhancedNFTCardProps {
  nft: EnrichedNFT
  viewMode?: 'grid-large' | 'grid-small' | 'list'
  showActions?: boolean
  onTransfer?: (nft: EnrichedNFT) => void
  onListForSale?: (nft: EnrichedNFT) => void
  onViewDetails?: (nft: EnrichedNFT) => void
}

export function EnhancedNFTCard({ 
  nft, 
  viewMode = 'grid-large',
  showActions = false,
  onTransfer,
  onListForSale,
  onViewDetails
}: EnhancedNFTCardProps) {
  const [imageError, setImageError] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyTokenId = () => {
    navigator.clipboard.writeText(nft.id)
    setCopied(true)
    toast.success("Token ID copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
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

  // List view layout
  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => onViewDetails ? onViewDetails(nft) : window.location.href = `/nft/${nft.id}`}
            >
              <div className="relative w-16 h-16 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={!imageError ? (nft.image || nft.thumbnail || "/placeholder.svg") : "/placeholder.svg"}
                  alt={nft.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 
                    className="font-semibold text-lg group-hover:text-muted-foreground transition-colors truncate cursor-pointer"
                    onClick={() => onViewDetails ? onViewDetails(nft) : window.location.href = `/nft/${nft.id}`}
                  >
                    {nft.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {nft.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {nft.id}
                    </div>
                    {nft.minted_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(nft.minted_at).toLocaleDateString()}
                      </div>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {nft.collection_id}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={copyTokenId}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Token ID</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={shareNFT}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share NFT</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {nft.external_url && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={nft.external_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View External Link</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view layout
  const isSmallGrid = viewMode === 'grid-small'

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-foreground/20">
      <CardContent className="p-0">
        {/* Image */}
        <div 
          className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
          onClick={() => onViewDetails ? onViewDetails(nft) : window.location.href = `/nft/${nft.id}`}
        >
          <Image
            src={!imageError ? (nft.image || nft.thumbnail || "/placeholder.svg") : "/placeholder.svg"}
            alt={nft.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          
          {/* Collection badge */}
          <Badge className="absolute top-3 right-3 text-xs bg-background/80 text-foreground">
            {nft.collection_id}
          </Badge>

          {/* Quick actions overlay */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-background/80"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        copyTokenId()
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Token ID</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-background/80"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        shareNFT()
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share NFT</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`p-${isSmallGrid ? '3' : '4'} space-y-${isSmallGrid ? '2' : '3'}`}>
          <div>
            <h3 
              className={`font-bold ${isSmallGrid ? 'text-sm' : 'text-lg'} mb-1 group-hover:text-muted-foreground transition-colors line-clamp-1 cursor-pointer`}
              onClick={() => onViewDetails ? onViewDetails(nft) : window.location.href = `/nft/${nft.id}`}
            >
              {nft.name}
            </h3>
            {!isSmallGrid && (
              <p className="text-sm text-muted-foreground line-clamp-2">{nft.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isSmallGrid ? 'flex-col items-start' : ''}`}>
            <div className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              <span>#{nft.id}</span>
            </div>
            {nft.minted_at && !isSmallGrid && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(nft.minted_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Creator info */}
          {nft.creator && !isSmallGrid && (
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs">{nft.creator[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">by {nft.creator}</span>
            </div>
          )}

          {/* Attributes preview */}
          {nft.attributes && nft.attributes.length > 0 && !isSmallGrid && (
            <div className="flex flex-wrap gap-1">
              {nft.attributes.slice(0, 2).map((attr, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.attributes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{nft.attributes.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Action buttons */}
          {showActions && !isSmallGrid && (
            <div className="flex gap-2 pt-2 border-t border-border">
              {onTransfer && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onTransfer(nft)}
                >
                  Transfer
                </Button>
              )}
              {onListForSale && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onListForSale(nft)}
                >
                  List for Sale
                </Button>
              )}
            </div>
          )}

          {/* External link */}
          {nft.external_url && !isSmallGrid && (
            <div className="pt-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <a href={nft.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}