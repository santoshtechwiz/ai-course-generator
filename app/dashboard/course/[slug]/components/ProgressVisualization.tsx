"use client"

// Reduced framer-motion usage for performance; prefer CSS transitions
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Flame, Bookmark as BookmarkIcon, TrendingUp, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import type { FC } from "react"

interface Props {
  courseStats: any
  formatDuration: (n: number) => string
  getSkillLevelStyling: (level: string) => { badge: string; icon: any }
}

const ProgressVisualization: FC<Props> = ({ courseStats, formatDuration, getSkillLevelStyling }) => {
  const skillStyling = getSkillLevelStyling(courseStats.skillLevel)
  const SkillIcon = skillStyling.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
  <div className="relative w-48 h-48 border-4 border-foreground bg-background shadow-[8px_8px_0px_0px] shadow-foreground">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
            {/* animate stroke-dashoffset with CSS transition for lighter animation */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="butt"
              strokeDasharray={`${2 * Math.PI * 50}`}
              style={{
                strokeDashoffset: 2 * Math.PI * 50 * (1 - courseStats.progressPercentage / 100),
                transition: "stroke-dashoffset 1s linear",
              }}
              className="text-foreground"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-black text-foreground">{courseStats.progressPercentage}%</div>
              <div className="text-sm font-bold text-foreground uppercase mt-1">Complete</div>
              <div className="text-xs font-black text-muted-foreground mt-1">
                {courseStats.completedChapters}/{courseStats.totalChapters}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div style={{ transitionDelay: "0.1s" }} className={`bg-chart-1 p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow ${neo.inner}`}>
          <div className="flex flex-col gap-2">
            <div className={`w-12 h-12 bg-background flex items-center justify-center ${neo.inner}`}>
              <CheckCircle className="h-6 w-6 text-foreground" />
            </div>
            <div className="text-3xl font-black text-foreground">{courseStats.completedChapters}</div>
            <div className="text-xs font-black text-foreground uppercase">Completed</div>
      </div>
    </div>

  <div style={{ transitionDelay: "0.2s" }} className={`bg-chart-3 p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow ${neo.inner}`}>
          <div className="flex flex-col gap-2">
            <div className={`w-12 h-12 bg-background flex items-center justify-center ${neo.inner}`}>
              <Clock className="h-6 w-6 text-foreground" />
            </div>
            <div className="text-3xl font-black text-foreground">{formatDuration(courseStats.estimatedTimeLeft)}</div>
            <div className="text-xs font-black text-foreground uppercase">Remaining</div>
          </div>
        </div>

  <div style={{ transitionDelay: "0.3s" }} className={`bg-chart-2 p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow ${neo.inner}`}>
          <div className="flex flex-col gap-2">
            <div className={`w-12 h-12 bg-background flex items-center justify-center ${neo.inner}`}>
              <Flame className="h-6 w-6 text-foreground" />
            </div>
            <div className="text-3xl font-black text-foreground">{courseStats.learningStreak}</div>
            <div className="text-xs font-black text-foreground uppercase">Day Streak</div>
          </div>
        </div>

  <div style={{ transitionDelay: "0.4s" }} className={`bg-chart-4 p-4 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow ${neo.inner}`}>
          <div className="flex flex-col gap-2">
            <div className={`w-12 h-12 bg-background flex items-center justify-center ${neo.inner}`}>
              <BookmarkIcon className="h-6 w-6 text-foreground" />
            </div>
            <div className="text-3xl font-black text-foreground">{courseStats.totalBookmarks}</div>
            <div className="text-xs font-black text-foreground uppercase">Bookmarks</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div style={{ transitionDelay: "0.5s" }} className={`bg-background p-6 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow ${neo.inner}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-black text-foreground uppercase">Study Time This Week</span>
            <div className={`w-10 h-10 bg-foreground flex items-center justify-center ${neo.inner}`}>
              <Star className="h-5 w-5 text-background" />
            </div>
          </div>
          <div className="text-4xl font-black text-foreground mb-2">{formatDuration(courseStats.studyTimeThisWeek)}</div>
          <div className="text-sm font-bold text-muted-foreground uppercase">Keep it up!</div>
  </div>
  <div style={{ transitionDelay: "0.6s" }} className={`bg-background p-6 shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-shadow ${neo.inner}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-black text-foreground uppercase">Quiz Average</span>
            <div className={`w-10 h-10 bg-foreground flex items-center justify-center ${neo.inner}`}>
              <Star className="h-5 w-5 text-background" />
            </div>
          </div>
          <div className="text-4xl font-black text-foreground mb-2">{courseStats.averageScore}%</div>
          <div className="text-sm font-bold text-muted-foreground uppercase">
            {courseStats.averageScore >= 80 ? "Excellent!" : courseStats.averageScore >= 60 ? "Good work!" : "Keep practicing!"}
          </div>
        </div>
      </div>

      <div style={{ transitionDelay: "0.7s" }} className="text-center">
        <Badge variant="default" className={cn(neo.badge, "px-8 py-4 text-lg font-black uppercase tracking-wider hover:shadow-[8px_8px_0px_0px] hover:shadow-foreground transition-shadow cursor-pointer", skillStyling.badge)}>
          <SkillIcon className="h-6 w-6 mr-3" />
          {courseStats.skillLevel} Level
        </Badge>
      </div>

  <div style={{ transitionDelay: "0.8s" }} className={cn("bg-background p-6 shadow-[4px_4px_0px_0px] shadow-foreground", neo.inner, "border-foreground")}>
        <h4 className="text-lg font-black text-foreground mb-4 flex items-center gap-2 uppercase">
          <TrendingUp className="h-5 w-5 text-foreground" />
          Course Progress
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-foreground uppercase">Completed</span>
            <span className="font-black text-foreground">{formatDuration(courseStats.completedDuration)} / {formatDuration(courseStats.totalDuration)}</span>
          </div>
          <div className={`relative h-6 bg-muted ${neo.inner}`}>
            <div className="absolute top-0 left-0 h-full bg-foreground" style={{ width: `${(courseStats.completedDuration / courseStats.totalDuration) * 100}%`, transition: "width 1s linear" }} />
          </div>
          <div className="flex justify-between text-xs font-black text-foreground uppercase">
            <span>0%</span>
            <span>{Math.round((courseStats.completedDuration / courseStats.totalDuration) * 100)}%</span>
            <span>100%</span>
          </div>
        </div>
  </div>
    </div>
  )
}

export default ProgressVisualization
