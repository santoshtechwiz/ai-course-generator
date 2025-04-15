import { Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import CertificateGenerator from "./CertificateGenerator"

interface CourseCompletionOverlayProps {
  onWatchAnotherCourse: () => void
  onClose: () => void
  courseName: string
}

export function CourseCompletionOverlay({ onWatchAnotherCourse, onClose, courseName }: CourseCompletionOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center w-full max-w-2xl mx-4 relative">
        <Button onClick={onClose} className="absolute top-4 right-4">
          <X className="w-6 h-6 text-gray-900 dark:text-white" />
        </Button>
        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Congratulations!</h2>
        <p className="text-lg md:text-xl mb-8 text-gray-700 dark:text-gray-300">You've completed the course!</p>
        <div className="space-y-4">
          <Button onClick={onWatchAnotherCourse} className="w-full text-lg py-3">
            Watch Another Course
          </Button>
          <Button variant="outline" className="w-full text-lg py-3">
            <CertificateGenerator courseName={courseName} />
          </Button>
        </div>
      </div>
    </div>
  )
}
