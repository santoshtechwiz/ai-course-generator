"use client"

import React, { useState, useEffect } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { InlineSpinner } from "@/components/ui/loader"
import dynamic from "next/dynamic"

// Import certificate component with SSR disabled
const CertificateGenerator = dynamic(
  () => import("@/app/dashboard/course/[slug]/components/CertificateGenerator"),
  { ssr: false }
)

interface CertificateWrapperProps {
  userName: string
  courseName: string
  fileName: string
  onDownload?: () => void
}

const CertificateWrapper: React.FC<CertificateWrapperProps> = ({
  userName,
  courseName,
  fileName,
  onDownload
}) => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Button disabled className="w-full bg-primary/80 hover:bg-primary/90 py-2 px-4 h-auto text-sm">
        <InlineSpinner size={16} className="mr-2 h-4 w-4" />
        Preparing certificate...
      </Button>
    )
  }

  // Only render PDFDownloadLink when on the client side with valid props
  if (userName && courseName) {
    return (
      <PDFDownloadLink
        document={<CertificateGenerator userName={userName} courseName={courseName} />}
        fileName={fileName}
        className="w-full"
      >
        {({ blob, url, loading, error }) => (
          <Button
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 py-2 px-4 h-auto text-sm"
            onClick={onDownload}
          >
            {loading ? (
              <>
                <InlineSpinner size={16} className="mr-2 h-4 w-4" />
                Generating certificate...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Certificate
              </>
            )}
          </Button>
        )}
      </PDFDownloadLink>
    )
  }

  return (
    <Button disabled className="w-full bg-primary/80 hover:bg-primary/90 py-2 px-4 h-auto text-sm">
      Certificate unavailable
    </Button>
  )
}

export default CertificateWrapper
