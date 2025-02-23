import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, BarChart, Trophy, Target } from "lucide-react"
import type React from "react" // Added import for React
import type { UserStats } from "@/app/types/types"

interface StatsViewProps {
  stats: UserStats
}

export function StatsView({ stats }: StatsViewProps) {
  const totalHoursSpent = Math.round(stats.totalTimeSpent / 3600)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} value={`${totalHoursSpent}h`} label="Total Time Spent" />
        <StatCard icon={BarChart} value={`${Math.round(stats.averageScore)}%`} label="Average Quiz Score" />
        <StatCard icon={Trophy} value={`${stats.highestScore}%`} label="Highest Score" />
        <StatCard icon={Target} value={`${Math.round(stats.courseCompletionRate)}%`} label="Course Completion Rate" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressCard
          title="Learning Efficiency"
          value={stats.learningEfficiency}
          description={`Your learning efficiency score is ${Math.round(stats.learningEfficiency)}%`}
        />
        <ProgressCard
          title="Consistency Score"
          value={stats.consistencyScore}
          description={`Your consistency score is ${Math.round(stats.consistencyScore)}%`}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Top Performing Topics</h3>
          <ul className="space-y-2">
            {stats.topPerformingTopics.map((topic, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{topic.topic}</span>
                <span className="font-medium">{Math.round(topic.averageScore)}%</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

function ProgressCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <Progress value={value} className="h-2" />
        <p className="text-sm mt-2 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

