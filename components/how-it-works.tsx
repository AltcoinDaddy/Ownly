import { Badge } from "@/components/ui/badge"

const steps = [
  {
    number: "01",
    title: "Connect Your Wallet",
    description: "Link your Dapper Wallet or Blocto Wallet to get started. Your Flow address is your identity.",
  },
  {
    number: "02",
    title: "Discover Collectibles",
    description: "Browse verified NFTs from creators and brands. From sports highlights to digital art.",
  },
  {
    number: "03",
    title: "Buy, Trade, or Mint",
    description: "Purchase collectibles, trade with others, or mint your own using our creator tools.",
  },
  {
    number: "04",
    title: "Showcase Your Collection",
    description: "Display your digital assets in your personal gallery. Share your collection with the world.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">Start Collecting in Minutes</h2>
          <p className="text-lg text-muted-foreground text-balance">Four simple steps to own your digital world</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-bold text-muted/30 mb-4">{step.number}</div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
