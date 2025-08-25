// Loader system removed. Provide minimal stubs to satisfy legacy imports.
import React from 'react'

export const Loader: React.FC<{ size?: any; className?: string }> = () => <span className="sr-only">loading</span>
export const LoadingSpinner = Loader
export const InlineSpinner = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <span className="sr-only">loading</span>
)

export default Loader
