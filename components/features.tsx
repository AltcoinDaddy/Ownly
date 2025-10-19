import { Sparkles, Shield, Zap, Users } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "NFT Minting",
    description: "Creators and brands can mint verified collectibles using Dapper Core contracts on Flow blockchain.",
  },
  {
    icon: Shield,
    title: "Secure Ownership",
    description: "Every collectible is verifiable on Flow's decentralized ledger. True ownership, guaranteed.",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Flow Access API provides live transaction and event tracking for instant marketplace updates.",
  },
  {
    icon: Users,
    title: "Personal Gallery",
    description: "Each user has a beautiful gallery showcasing their owned NFTs and digital collectibles.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Built for the Future of Digital Ownership
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            Powered by Flow blockchain and Dapper Core APIs, Ownly gives everyone the power to truly own digital
            moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 hover:border-foreground transition-colors"
            >
              <div className="w-12 h-12 bg-foreground text-background rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
