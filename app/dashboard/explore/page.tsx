import { TileGrid } from "../components/TileGrid"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10">
     
      <main className="flex-grow flex flex-col justify-center items-center px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Course AI</h1>
        <p className="text-xl text-center text-muted-foreground mb-12 max-w-2xl">
          Leverage AI-powered tools to create dynamic courses, quizzes, and educational content effortlessly.
        </p>
        <TileGrid />
      </main>

    </div>
  )
}
