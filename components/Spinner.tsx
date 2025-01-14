import React from "react"

export const Spinner = ({ size = 24, color = "currentColor", className = "" }) => {
  return (
    <div
      className={`animate-spin inline-block ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className={`h-${size} w-${size} text-${color}`}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
    </div>
  )
}

export default Spinner
