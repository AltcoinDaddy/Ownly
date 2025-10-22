import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { Footer } from "@/components/footer"
import { LoadingFallback } from "@/components/loading-fallback"
import { Suspense } from "react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback variant="minimal" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<LoadingFallback variant="minimal" />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<LoadingFallback variant="minimal" />}>
        <Features />
      </Suspense>
      <Suspense fallback={<LoadingFallback variant="minimal" />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<LoadingFallback variant="minimal" />}>
        <Footer />
      </Suspense>
    </main>
  )
}
