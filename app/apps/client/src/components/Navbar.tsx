import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center py-4 px-6">
      <Link href="/" className="text-2xl font-bold">
        MetaGame
      </Link>
      <div className="space-x-4">
        <Link href="/spaces" className="text-white hover:text-purple-300">
          Spaces
        </Link>
        <Link href="/about" className="text-white hover:text-purple-300">
          About
        </Link>
        <Button variant="outline" className="text-white border-white hover:bg-white hover:text-purple-900">
          Login
        </Button>
      </div>
    </nav>
  )
}

