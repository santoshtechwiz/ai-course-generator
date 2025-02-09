import type React from "react"

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ children, className = "" }) => {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16 ${className}`}>
      {children}
    </section>
  )
}

export default SectionWrapper

