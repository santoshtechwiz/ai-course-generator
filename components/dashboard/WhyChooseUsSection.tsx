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
    <section className="py-12 px-4 md:py-16 md:px-8">
      <div className="container mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-6 md:text-3xl md:font-bold md:mb-8">Why Choose Us</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="p-4">
              <CardHeader className="flex flex-col items-center">
                <feature.icon className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg font-medium">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

