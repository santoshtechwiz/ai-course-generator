import { format, formatDistanceToNow } from "date-fns"

export const formatDate = (date: Date | string | null): string => {
  if (!date) return "N/A"

  const dateObj = typeof date === "string" ? new Date(date) : date

  return format(dateObj, "MMM dd, yyyy")
}

export const formatDateWithTime = (date: Date | string | null): string => {
  if (!date) return "N/A"

  const dateObj = typeof date === "string" ? new Date(date) : date

  return format(dateObj, "MMM dd, yyyy h:mm a")
}

export const formatRelativeDate = (date: Date | string | null): string => {
  if (!date) return "N/A"

  const dateObj = typeof date === "string" ? new Date(date) : date

  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export const calculateSavings = (monthlyPrice: number, longerTermPrice: number, months: number): number => {
  const annualCostMonthly = monthlyPrice * months
  const annualCostLongerTerm = longerTermPrice
  return Math.round((1 - annualCostLongerTerm / annualCostMonthly) * 100)
}

export const getDiscountedPrice = (originalPrice: number, discountPercentage: number): number => {
  if (discountPercentage <= 0) return originalPrice
  return Number.parseFloat((originalPrice * (1 - discountPercentage / 100)).toFixed(2))
}

