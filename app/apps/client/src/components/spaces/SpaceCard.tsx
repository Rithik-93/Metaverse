import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { API } from "@/config"

interface SpaceProps {
  space: {
    id: string
    name: string
    width: number
    height: number
    thumbnail: string | null
    creatorId: string
  }
}

export default function SpaceCard({ space }: SpaceProps) {
    const router = useRouter();
    const spaceId = space.id;
    const token = window.localStorage.getItem('token')?.split(' ')[1];
    if(!token) {
        router.push('/signin')
    }

  return (
    <Card className="overflow-hidden" onClick={() => router.push(`/arena/?spaceId=${spaceId}&token=${token}`)}>
      <CardContent className="p-0">
        {space.thumbnail ? (
          <Image
            src={space.thumbnail || "/placeholder.svg"}
            alt={space.name}
            width={300}
            height={200}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No thumbnail</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4">
        <h2 className="text-lg font-semibold mb-2">{space.name}</h2>
        <p className="text-sm text-gray-600 mb-2">
          Size: {space.width}x{space.height}
        </p>
        <Button variant="outline" className="mt-2">
          Enter Space
        </Button>
      </CardFooter>
    </Card>
  )
}

