import { Quote } from 'lucide-react'

const quotes = [
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" }
]

const RandomQuote = () => {
  // Get a random quote server-side
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
      <div className="relative bg-background/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-primary/10">
        <div className="flex items-start gap-4">
          <Quote className="text-primary w-8 h-8 mt-1 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground italic">
              {randomQuote.text}
            </p>
            <p className="text-sm text-muted-foreground">
              - {randomQuote.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RandomQuote
