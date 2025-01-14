import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Book, Brain, Zap, BarChart } from 'lucide-react'

const features = [
  {
    icon: Book,
    title: 'Extensive Course Library',
    description: 'Access a wide range of courses covering various topics and skill levels.',
  },
  {
    icon: Brain,
    title: 'Interactive Learning',
    description: 'Engage with our interactive quizzes and hands-on projects for better retention.',
  },
  {
    icon: Zap,
    title: 'Learn at Your Own Pace',
    description: 'Flexible learning schedules that adapt to your lifestyle and preferences.',
  },
  {
    icon: BarChart,
    title: 'Track Your Progress',
    description: 'Monitor your learning journey with detailed progress tracking and analytics.',
  },
]

export default function WhyChooseUsSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="h-8 w-8 mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

