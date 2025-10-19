import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { NFT } from "@/lib/types"
import { Eye, Heart } from "lucide-react"

interface NFTCardProps {
  nft: NFT
}

export function NFTCard({ nft }: NFTCardProps) {
  const rarityColors = {
    common: "bg-muted text-muted-foreground",
    rare: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    epic: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    legendary: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  }

  return (
    <Link href={`/nft/${nft.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-foreground/20">
        <CardContent className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={nft.image || "/placeholder.svg?height=400&width=400"}
              alt={nft.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <Badge className={`absolute top-3 right-3 capitalize ${rarityColors[nft.rarity]}`}>{nft.rarity}</Badge>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-muted-foreground transition-colors line-clamp-1">
                {nft.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{nft.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={nft.creator.avatar || "/placeholder.svg"} alt={nft.creator.displayName} />
                <AvatarFallback>{nft.creator.displayName[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{nft.creator.username}</span>
              {nft.creator.verified && <span className="text-xs">✓</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-bold">
                  {nft.price} {nft.currency}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {nft.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {nft.likes}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
