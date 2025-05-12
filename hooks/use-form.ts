"use client"

import type React from "react"

import { useState, useCallback, type FormEvent } from "react"

interface FormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => void | Promise<void>
  validate?: (values: T) => Partial<Record<keyof T, string>>
}

/**
 * Hook for form handling with validation
 * @param options Form options
 * @returns Form state and methods
 */
export function useForm<T extends Record<string, any>>({ initialValues, onSubmit, validate }: FormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target

      setValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }))

      // Mark field as touched
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }))
    },
    [],
  )

  // Set a specific field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  // Mark a field as touched
  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }))
  }, [])

  // Set an error for a field
  const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }, [])

  // Reset the form
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitted(false)
  }, [initialValues])

  // Validate the form
  const validateForm = useCallback(() => {
    if (!validate) return {}

    const validationErrors = validate(values)
    setErrors(validationErrors)
    return validationErrors
  }, [validate, values])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault()

      setIsSubmitted(true)

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>,
      )
      setTouched(allTouched)

      // Validate the form
      const validationErrors = validate ? validate(values) : {}
      setErrors(validationErrors)

      // Check if there are any errors
      const hasErrors = Object.keys(validationErrors).length > 0
      if (hasErrors) return

      // Submit the form
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, validate, values],
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    validateForm,
  }
}
