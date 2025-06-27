import { motion } from "framer-motion"
import { Award } from "lucide-react"

interface LearningInsightsProps {
  performance: any
  stats: any
  extraInfo?: {
    title?: string
    tips?: string[]
  }
}

export function LearningInsights({ performance, stats, extraInfo }: LearningInsightsProps) {
  return (
    <motion.div
      className="rounded-3xl shadow-2xl border-2 border-muted/20 p-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      <div className="text-center space-y-6">        <div className="flex items-center justify-center gap-4">
          <Award className="w-12 h-12 text-primary" />
          <h2 className="text-3xl font-bold">{extraInfo?.title || "Learning Insights"}</h2>
        </div>
        <div className={`p-6 rounded-2xl ${performance.bgColor} ${performance.borderColor} border-2`}>
          <div className="text-6xl mb-4">{performance.emoji}</div>
          <h3 className={`text-2xl font-bold mb-2 ${performance.color}`}>
            {performance.level} Performance
          </h3>
          <p className={`text-lg ${performance.color}`}>
            {performance.message}
          </p>
          <p className="text-muted-foreground mt-4">
            {performance.insights}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <h4 className="font-bold text-blue-700 mb-3">Strengths</h4>
            <ul className="text-blue-600 space-y-2">
              {stats.correct > 0 && <li>• Answered {stats.correct} questions correctly</li>}
              {stats.accuracy >= 70 && <li>• Strong overall understanding</li>}
              {stats.avgTime < 30000 && <li>• Good time management</li>}
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-orange-50 border-2 border-orange-200">
            <h4 className="font-bold text-orange-700 mb-3">Areas for Improvement</h4>
            <ul className="text-orange-600 space-y-2">
              {stats.incorrect > 0 && <li>• Review {stats.incorrect} incorrect answers</li>}
              {stats.accuracy < 70 && <li>• Focus on core concepts</li>}
              {stats.avgTime > 60000 && <li>• Work on response speed</li>}
            </ul>
          </div>        </div>

        {/* Additional tips if provided */}
        {extraInfo?.tips && extraInfo.tips.length > 0 && (
          <div className="p-6 rounded-2xl bg-violet-50 border-2 border-violet-200 mt-6">
            <h4 className="font-bold text-violet-700 mb-3">Additional Tips</h4>
            <ul className="text-violet-600 space-y-2">
              {extraInfo.tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}
