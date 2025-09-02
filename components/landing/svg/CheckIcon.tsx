"use client"

import { Check } from "lucide-react"

interface CheckIconProps {
  className?: string
}

const CheckIcon = ({ className = "h-5 w-5 text-green-500 mr-2" }: CheckIconProps) => {
  return <Check className={className} />
}

export default CheckIcon
