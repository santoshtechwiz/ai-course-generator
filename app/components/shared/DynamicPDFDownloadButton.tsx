import type React from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface PDFDownloadButtonProps {
  document: React.ReactElement
  fileName: string
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ document, fileName }) => {
  return (
    <PDFDownloadLink document={document} fileName={fileName}>
      {({ blob, url, loading, error }) => (
        <Button disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

export default PDFDownloadButton

