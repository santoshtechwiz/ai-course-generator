"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="relative max-w-md mx-auto mb-12">
      <Input
        type="text"
        placeholder="Search courses..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-4 py-2 w-full rounded-full shadow-md focus:ring-2 focus:ring-blue-300 transition-all duration-300"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  )
}

