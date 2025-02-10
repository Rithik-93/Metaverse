'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CallToAction() {

  const router = useRouter();

  return (
    <section className="py-20 px-4 text-center">
      <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Join thousands of explorers in our metaverse. Create, connect, and experience a new reality.
      </p>
      <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
        Join Now
      </Button>
    </section>
  )
}

