import { CuboidIcon as Cube, Users, Paintbrush } from 'lucide-react'

const features = [
  {
    icon: <Cube className="h-10 w-10" />,
    title: 'Custom Spaces',
    description: 'Create and customize your own virtual spaces',
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: 'Social Interaction',
    description: 'Connect with friends and meet new people',
  },
  {
    icon: <Paintbrush className="h-10 w-10" />,
    title: 'Creative Tools',
    description: 'Express yourself with powerful creation tools',
  },
]

export default function Features() {
  return (
    <section className="py-20 px-4">
      <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
