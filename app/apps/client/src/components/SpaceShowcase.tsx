"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface Space {
  id: string
  name: string
  width: number
  height: number
  thumbnail: string | null
}

export default function SpaceShowcase() {
  const [spaces, setSpaces] = useState<Space[]>([])

  useEffect(() => {
    async function fetchSpaces() {
      try {
        const response = await fetch("/api/v1/spaces/getspaces")
        if (!response.ok) {
          throw new Error("Failed to fetch spaces")
        }
        const data = await response.json()
        setSpaces(data.slice(0, 3))
      } catch (err) {
        console.error("Error fetching spaces:", err)
      }
    }

    fetchSpaces()
  }, [])

  return (
    <section className="py-20 px-4">
      <h2 className="text-4xl font-bold text-center mb-12">Featured Spaces</h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {spaces.map((space) => (
          <Card key={space.id} className="bg-gray-800 overflow-hidden">
            <CardContent className="p-0">
              {space.thumbnail ? (
                <Image
                  src={space.thumbnail || "/placeholder.svg"}
                  alt={space.name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No thumbnail</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{space.name}</h3>
                <p className="text-gray-300">
                  Size: {space.width}x{space.height}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

