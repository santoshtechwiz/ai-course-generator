import { Card, CardContent, CardFooter } from "@/components";
import { motion } from "framer-motion";

  // FlashCardScoreOverview component
  function FlashCardScoreOverview({
    percentCorrect,
    percentStillLearning,
    percentIncorrect,
    correctAnswers,
    totalQuestions,
    stillLearningAnswers,
    incorrectAnswers,
    formattedTime,
    avgTimePerCard,
  }: any) {
    return (
      <motion.div
        className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <h2 className="text-2xl font-bold">{percentCorrect}%</h2>
                <p className="text-sm text-primary">Correct</p>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{percentStillLearning}%</h2>
                <p className="text-sm text-primary">Still Learning</p>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{percentIncorrect}%</h2>
                <p className="text-sm text-primary">Incorrect</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <p className="text-sm text-center">Time: {formattedTime} | Avg/Card: {avgTimePerCard}s</p>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }
export default FlashCardScoreOverview;