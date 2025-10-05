"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Dynamic import for PDF generation - @react-pdf/renderer is ~500KB
// Only load when user requests PDF download
const UnifiedPdfGenerator = dynamic(
  () => import("@/components/shared/UnifiedPdfGenerator"),
  {
    loading: () => (
      <Button disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading PDF Generator...
      </Button>
    ),
    ssr: false,
  }
)

export default UnifiedPdfGenerator
