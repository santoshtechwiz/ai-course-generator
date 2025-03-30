import { Check, Zap } from "lucide-react";

// Redesigned TokenUsageExplanation component
export default function TokenUsageExplanation() {
    return (
      <div className="mt-12 p-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-1/4 flex justify-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="md:w-3/4 text-left">
            <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Understanding Token Usage
            </h3>
            <p className="text-muted-foreground mb-4">
              Tokens are used to generate quizzes and access various features on our platform. Each quiz you generate
              consumes a certain number of tokens based on the complexity and type of questions.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Generating multiple-choice quizzes consumes fewer tokens</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Creating open-ended or code-based quizzes may require more tokens</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Downloading quizzes in PDF format also consumes tokens</span>
              </li>
            </ul>
            <p className="text-muted-foreground">
              You can purchase additional tokens at any time to continue using our services.
            </p>
          </div>
        </div>
      </div>
    )
  }
  