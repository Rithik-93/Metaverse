"use client"

import { useState, useEffect } from "react"
import SpaceCard from "./SpaceCard"
import Loading from "../Loading"
import ErrorMessage from "../Error"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface Space {
    id: string
    name: string
    width: number
    height: number
    thumbnail: string | null
    creatorId: string
}

export default function SpacesList() {
    const [spaces, setSpaces] = useState<Space[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        async function fetchSpaces() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_GAME_API}/api/v1/spaces/getspaces`)
                if (!response.ok) {
                    throw new Error("Failed to fetch spaces")
                }
                const data = await response.json()
                setSpaces(data)
            } catch (err) {
                setError("Error fetching spaces. Please try again later.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchSpaces()
    }, [])

    if (isLoading) {
        return <Loading />
    }

    if (error) {
        return <ErrorMessage error={error} />
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div>
                <Button onClick={() => {
                    router.push('/create')
                }}>Create Space</Button>
            </div>
            {spaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
            ))}
        </div>
    )
}

