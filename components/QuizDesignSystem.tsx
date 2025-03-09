// This file defines consistent styling for all quiz components
export const quizStyles = {
  container: "w-full max-w-3xl mx-auto bg-card rounded-lg border shadow-sm overflow-hidden",
  header: "bg-muted/50 p-4 border-b border-border/50",
  headerTitle: "text-xl font-semibold",
  buttonContainer: "flex justify-between items-center",
  progressContainer: "w-full h-2 bg-muted rounded-full overflow-hidden",
  progressBar: "h-full bg-primary rounded-full",
  questionContainer: "p-6 border-b border-border/50",
  optionContainer: "flex items-center space-x-2 rounded-md border p-4 transition-colors",
  optionSelected: "border-primary bg-primary/5",
  optionDefault: "border-input hover:bg-muted/50",
  optionCorrect: "border-green-500 bg-green-50 dark:bg-green-900/20",
  optionIncorrect: "border-red-500 bg-red-50 dark:bg-red-900/20",
}

