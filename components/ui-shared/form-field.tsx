import type React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  className?: string
  required?: boolean
  children: React.ReactNode
}

export const FormField = ({ label, htmlFor, error, className, required = false, children }: FormFieldProps) => {
  return (
    <div className={cn("mb-4", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

