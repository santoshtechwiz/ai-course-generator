import { cn } from "@/lib/utils"

// Shared quiz component styles
export const quizStyles = {
  // Container styles
  container: "w-full bg-background rounded-xl border border-border/50 shadow-sm overflow-hidden",

  // Header styles
  header: "p-6 border-b border-border/50 bg-muted/30",
  headerTitle: "text-2xl font-semibold text-foreground flex items-center gap-2",
  headerDescription: "mt-2 text-muted-foreground text-sm",

  // Question styles
  questionContainer: "p-6 border-b border-border/50",
  questionNumber: "text-sm font-medium text-muted-foreground mb-2",
  questionText: "text-lg font-medium text-foreground mb-4",
  codeBlock: "p-4 bg-muted rounded-md font-mono text-sm overflow-x-auto my-4 border border-border/50",

  // Options styles
  optionsContainer: "space-y-3 mt-4",
  optionItem:
    "relative flex items-start p-4 rounded-lg border border-border/50 transition-all hover:border-primary/50 hover:bg-primary/5",
  optionItemSelected: "border-primary bg-primary/10",
  optionItemCorrect: "border-green-500 bg-green-50 dark:bg-green-950/20",
  optionItemIncorrect: "border-red-500 bg-red-50 dark:bg-red-950/20",
  optionText: "ml-3 text-foreground",

  // Input styles
  inputField:
    "w-full p-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background",

  // Button styles
  buttonContainer: "flex justify-between mt-6",
  primaryButton:
    "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors",
  secondaryButton:
    "bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium transition-colors",
  disabledButton: "bg-muted text-muted-foreground cursor-not-allowed px-4 py-2 rounded-md font-medium",

  // Feedback styles
  feedbackContainer: "mt-4 p-4 rounded-lg border",
  feedbackCorrect: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400",
  feedbackIncorrect: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400",
  feedbackText: "text-sm",

  // Progress styles
  progressContainer: "w-full h-2 bg-muted rounded-full overflow-hidden mt-6",
  progressBar: "h-full bg-primary transition-all duration-300 ease-in-out",

  // Results styles
  resultsContainer: "p-6 text-center",
  resultsScore: "text-3xl font-bold text-foreground mb-2",
  resultsText: "text-muted-foreground mb-4",

  // Animation styles
  fadeIn: "animate-in fade-in duration-300",
  slideIn: "animate-in slide-in-from-bottom-5 duration-300",
}

// Helper function to combine quiz styles with additional classes
export function quizStylesWithClass(styleKey: keyof typeof quizStyles, additionalClasses?: string) {
  return cn(quizStyles[styleKey], additionalClasses)
}

