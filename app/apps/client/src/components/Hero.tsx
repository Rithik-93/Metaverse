'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Hero() {

  const router = useRouter();

  return (
    <section className="relative h-screen flex items-center justify-center text-center px-4">
      <div className="z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">Enter the Metaverse</h1>
        <p className="text-xl md:text-2xl mb-8">Explore infinite worlds, create, and connect in our virtual universe</p>
        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
        router.push('/signin')
      }}>
          Get Started
        </Button>
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-60"></div>
        {/* <video autoPlay loop muted className="w-full h-full object-cover">
          <source src="/metaverse-background.mp4" type="video/mp4" />
        </video> */}
      </div>
    </section>
  )
}

