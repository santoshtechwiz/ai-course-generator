import React from "react";
import { useAppDispatch } from "@/store/hooks";
import { incrementDownloadCount } from "@/store/slices/certificate-slice";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import CertificateGenerator from "./CertificateGenerator";

interface CertificateModalProps {
  show: boolean;
  onClose: () => void;
  courseId: string | number;
  courseTitle: string;
  userName: string | null;
  totalLessons: number;
}

const CertificateModal: React.FC<CertificateModalProps> = ({
  show,
  onClose,
  courseId,
  courseTitle,
  userName = "Student",
  totalLessons,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            duration: 0.3 
          }}
          className="bg-background rounded-2xl shadow-2xl border border-border/50 max-w-lg w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with celebration animation */}
          <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-6 text-white text-center overflow-hidden">
            {/* Floating celebration elements */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute top-2 right-2"
            >
              <span className="text-2xl">🎉</span>
            </motion.div>
            
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-2 left-2"
            >
              <span className="text-2xl">🏆</span>
            </motion.div>

            {/* Main header content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">
                Congratulations!
              </h2>
              <p className="text-lg text-white/90 font-medium">
                You've completed the course
              </p>
            </motion.div>

            {/* Course title with gradient text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-4"
            >
              <h3 className="text-xl font-semibold bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                "{courseTitle}"
              </h3>
            </motion.div>
          </div>

          {/* Certificate content */}
          <div className="p-6 space-y-6">
            {/* Achievement stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-2xl font-bold text-primary mb-1">
                  {totalLessons}
                </div>
                <div className="text-sm text-muted-foreground">
                  Lessons Completed
                </div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  100%
                </div>
                <div className="text-sm text-muted-foreground">
                  Course Progress
                </div>
              </div>
            </motion.div>

            {/* Certificate preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Your Certificate
                </h4>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">CA</span>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                A professional certificate showcasing your achievement in {courseTitle}
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="space-y-3"
            >
              {/* Download Certificate Button */}
              <PDFDownloadLink
                document={<CertificateGenerator courseName={courseTitle} userName={userName || "Student"} />}
                fileName={`${(courseTitle || 'Course').replace(/\s+/g, '_')}_Certificate.pdf`}
                className="w-full"
              >
                {({ loading }) => (
                  <Button 
                    disabled={loading} 
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    onClick={() => {
                      // Mark certificate as downloaded to prevent repeated showing
                      dispatch(incrementDownloadCount());
                      toast({
                        title: "Certificate Downloaded!",
                        description: "Your course completion certificate has been downloaded successfully.",
                      });
                    }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        />
                        Generating Certificate...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Download Certificate
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>

              {/* Share Certificate Button */}
              <Button 
                variant="outline" 
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: `I completed ${courseTitle} on CourseAI!`,
                      text: `Check out my certificate for completing ${courseTitle} on CourseAI!`,
                      url: window.location.href,
                    });
                  } else {
                    // Fallback to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link Copied!",
                      description: "Course link copied to clipboard",
                    });
                  }
                }}
                className="w-full h-12 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share Achievement
              </Button>

              {/* Continue Learning Button */}
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
              >
                Continue Learning
              </Button>
            </motion.div>

            {/* Social sharing suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="text-center pt-4 border-t border-border/50"
            >
              <p className="text-sm text-muted-foreground mb-3">
                Share your achievement with the world!
              </p>
              <div className="flex justify-center space-x-4">
                {['LinkedIn', 'Twitter', 'Facebook'].map((platform) => (
                  <button
                    key={platform}
                    className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors duration-300"
                    onClick={() => {
                      const url = `https://www.${platform.toLowerCase()}.com/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`I just completed ${courseTitle} on CourseAI!`)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <span className="text-xs font-medium text-muted-foreground hover:text-primary">
                      {platform.charAt(0)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ✅ PHASE 2: Memoize modal to prevent re-renders when props unchanged
export default React.memo(CertificateModal);
