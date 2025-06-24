import { motion } from "framer-motion"
import { Trophy, Clock, Target, Home, RefreshCw, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PerformanceSummaryProps {
  title: string
  performance: any
  percentage: number
  stats: any
  result: any
  formatDate: (dateString: string) => string
  onRetry: () => void
  onGoHome: () => void
  onShare: () => void
}

export function PerformanceSummary({
  title, performance, percentage, stats, result, formatDate, onRetry, onGoHome, onShare
}: PerformanceSummaryProps) {
  return (
    <motion.div
      className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-center gap-4">
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Trophy className="w-8 h-8 text-primary" />
        </motion.div>
        <div className="text-left">
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {title}
          </motion.h1>
          <motion.div
            className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Badge
          variant="secondary"
          className={`px-4 py-2 text-lg font-bold shadow-md ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2`}
        >
          <span className="mr-2 text-xl">{performance.emoji}</span>
          {performance.grade} - {performance.level}
        </Badge>
        <div className="text-6xl font-black text-primary">
          {percentage}%
        </div>
      </div>
      <p className="text-muted-foreground text-lg">
        {performance.insights}
      </p>
      {/* Score Overview */}
      <motion.div
        className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10 mt-8"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <CardHeader className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border-b-2 border-primary/10 p-8">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="text-4xl font-black text-green-500 mb-2">
                {stats.correct}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Correct</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-lg"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="text-4xl font-black text-red-500 mb-2">
                {stats.incorrect}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 font-semibold">Incorrect</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center shadow-lg"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="text-4xl font-black text-blue-500 mb-2">
                {stats.accuracy}%
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Accuracy</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 text-center shadow-lg"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="text-4xl font-black text-purple-500 mb-2">
                {stats.avgTime ? `${Math.round(stats.avgTime / 1000)}s` : 'N/A'}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300 font-semibold">Avg Time</div>
            </motion.div>
          </div>
          {/* Add date and time information */}
          <div className="mt-8 p-6 bg-muted/20 border border-muted rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold">Completed on</div>
                  <div className="text-muted-foreground">{formatDate(result.completedAt || '')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold">Submitted on</div>
                  <div className="text-muted-foreground">{formatDate(result.submittedAt || '')}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-t-2 border-muted/20 flex flex-wrap gap-4 justify-between p-8">
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5" />
              Retake Quiz
            </Button>
            <Button
              variant="outline"
              onClick={onGoHome}
              className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2"
            >
              <Home className="w-5 h-5" />
              All Quizzes
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={onShare}
            className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2"
          >
            <Share2 className="w-5 h-5" />
            Share Results
          </Button>
        </CardFooter>
      </motion.div>
    </motion.div>
  )
}
