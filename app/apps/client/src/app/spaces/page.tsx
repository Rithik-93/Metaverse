import SpacesList from '@/components/spaces/SpaceList'

export default function SpacesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Available Spaces</h1>
      <SpacesList />
    </div>
  )
}
