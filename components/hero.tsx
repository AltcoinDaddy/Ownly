import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-6 text-xs font-medium px-4 py-1.5">
            Powered by Flow Blockchain
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-balance">
            Own What Matters.
            <br />
            <span className="text-muted-foreground">Collect. Trade. Ownly.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            The Flow blockchain-powered platform that lets fans, creators, and brands mint, trade, and showcase
            authentic digital collectibles.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto">
              Start Collecting
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Explore Marketplace
            </Button>
          </div>
        </div>

        {/* Overlapping UI Mockups */}
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left mockup - Marketplace */}
            <div className="relative lg:translate-x-8 lg:translate-y-8">
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <div className="w-3 h-3 rounded-full bg-muted" />
                  </div>
                  <div className="flex-1 bg-muted rounded px-3 py-1.5 text-xs text-muted-foreground">
                    ownly.app/marketplace
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Trending Collectibles</h3>
                    <Badge variant="secondary">Live</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-muted rounded-lg p-3 space-y-2">
                        <div className="aspect-square bg-secondary rounded-md" />
                        <div className="space-y-1">
                          <div className="h-3 bg-secondary rounded w-3/4" />
                          <div className="h-2 bg-secondary rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right mockup - NFT Detail */}
            <div className="relative lg:-translate-x-8 lg:-translate-y-8">
              <div className="bg-foreground text-background border-2 border-foreground rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-background/20" />
                    <div className="w-3 h-3 rounded-full bg-background/20" />
                    <div className="w-3 h-3 rounded-full bg-background/20" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="aspect-square bg-background/10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💎</div>
                      <div className="text-xs opacity-60">Digital Collectible</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm opacity-60 mb-1">Current Price</div>
                      <div className="text-2xl font-bold">0.5 FLOW</div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-background text-foreground rounded-lg py-2 text-center text-sm font-medium">
                        Buy Now
                      </div>
                      <div className="flex-1 bg-background/10 rounded-lg py-2 text-center text-sm font-medium">
                        Make Offer
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code snippet overlay */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-2xl">
            <div className="bg-foreground text-background rounded-xl p-6 shadow-2xl border-2 border-foreground font-mono text-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-background/20" />
                <div className="w-3 h-3 rounded-full bg-background/20" />
                <div className="w-3 h-3 rounded-full bg-background/20" />
                <span className="text-xs opacity-60 ml-2">flow-integration.ts</span>
              </div>
              <pre className="text-xs leading-relaxed">
                <code>{`import * as fcl from "@onflow/fcl"

// Mint NFT on Flow
const txId = await fcl.mutate({
  cadence: mintCollectible,
  args: (arg, t) => [
    arg(metadata, t.String),
    arg(recipient, t.Address)
  ]
})`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
