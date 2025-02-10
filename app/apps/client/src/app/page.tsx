import Hero from "@/components/Hero"
import Features from "@/components/Features"
import SpaceShowcase from "@/components/SpaceShowcase"
import CallToAction from "@/components/CallToAction"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-900 text-white">
      <Hero />
      <Features />
      {/* <SpaceShowcase /> */}
      <CallToAction />
    </div>
  )
}

