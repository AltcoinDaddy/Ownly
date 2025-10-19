"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Plus, ShoppingBag, Palette } from "lucide-react"

interface EmptyGalleryStateProps {
  title?: string
  description?: string
  actionText?: string
  actionHref?: string
  variant?: 'owned' | 'created' | 'marketplace' | 'default'
}

export function EmptyGalleryState({
  title,
  description,
  actionText,
  actionHref,
  variant = 'default'
}: EmptyGalleryStateProps) {
  // Default configurations based on variant
  const configs = {
    owned: {
      icon: Package,
      title: "No NFTs in Your Collection",
      description: "You don't own any NFTs yet. Start building your collection by exploring the marketplace or creating your first NFT.",
      actionText: "Browse Marketplace",
      actionHref: "/marketplace",
      secondaryAction: {
        text: "Create NFT",
        href: "/mint"
      }
    },
    created: {
      icon: Palette,
      title: "No NFTs Created",
      description: "You haven't created any NFTs yet. Start your creative journey by minting your first digital collectible.",
      actionText: "Create Your First NFT",
      actionHref: "/mint"
    },
    marketplace: {
      icon: ShoppingBag,
      title: "No NFTs Available",
      description: "There are no NFTs available in the marketplace right now. Check back later or create your own to get started.",
      actionText: "Create NFT",
      actionHref: "/mint"
    },
    default: {
      icon: Package,
      title: "No NFTs Found",
      description: "No NFTs are available at the moment.",
      actionText: "Explore",
      actionHref: "/"
    }
  }

  const config = configs[variant]
  const Icon = config.icon

  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalActionText = actionText || config.actionText
  const finalActionHref = actionHref || config.actionHref

  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-3">{finalTitle}</h3>
        
        <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
          {finalDescription}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg">
            <Link href={finalActionHref}>
              <Plus className="w-4 h-4 mr-2" />
              {finalActionText}
            </Link>
          </Button>
          
          {variant === 'owned' && config.secondaryAction && (
            <Button variant="outline" size="lg" asChild>
              <Link href={config.secondaryAction.href}>
                <Palette className="w-4 h-4 mr-2" />
                {config.secondaryAction.text}
              </Link>
            </Button>
          )}
        </div>

        {/* Additional helpful links */}
        <div className="mt-8 pt-6 border-t border-border w-full max-w-md">
          <p className="text-sm text-muted-foreground mb-4">Need help getting started?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/marketplace" className="text-primary hover:underline">
              Browse Marketplace
            </Link>
            <Link href="/mint" className="text-primary hover:underline">
              Create NFT
            </Link>
            <Link href="/profile" className="text-primary hover:underline">
              View Profile
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}