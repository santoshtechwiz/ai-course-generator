import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fill in the Blanks Quizzes",
  description: "Create and practice fill in the blanks exercises to test your knowledge",
}

export default function BlanksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}
