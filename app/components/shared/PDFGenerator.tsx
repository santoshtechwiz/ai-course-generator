"use client"
import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer"
import { marked } from "marked"
import { Button } from "@/components/ui/button"

import { useState } from "react"
import { SiAdobe } from "react-icons/si"
import useSubscriptionStore from "@/store/useSubscriptionStore"

// Register a font with multiple weights
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
      fontStyle: "italic",
    },
  ],
})

// Define styles with colors
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
    color: "#1D4ED8", // Blue color for title
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 10,
    color: "#374151", // Gray text
  },
  heading1: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    color: "#DC2626", // Red color for H1
  },
  heading2: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#10B981", // Green color for H2
  },
  heading3: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 14,
    color: "#6366F1", // Indigo color for H3
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
    color: "#6B7280", // Dark gray for list items
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
})

// Helper function to render inline styles
const renderInlineStyles = (text: string, style: any) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={[style, styles.bold]}>
          {part.slice(2, -2)}
        </Text>
      )
    } else if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Text key={index} style={[style, styles.italic]}>
          {part.slice(1, -1)}
        </Text>
      )
    }
    return (
      <Text key={index} style={style}>
        {part}
      </Text>
    )
  })
}

// Convert Markdown to structured content
const parseMarkdown = (markdown: string) => {
  const tokens = marked.lexer(markdown)
  return tokens.map((token, index) => {
    switch (token.type) {
      case "heading":
        const HeadingStyle = token.depth === 1 ? styles.heading1 : token.depth === 2 ? styles.heading2 : styles.heading3
        return (
          <Text key={index} style={HeadingStyle}>
            {renderInlineStyles(token.text, HeadingStyle)}
          </Text>
        )
      case "paragraph":
        return (
          <Text key={index} style={styles.paragraph}>
            {renderInlineStyles(token.text, styles.paragraph)}
          </Text>
        )
      case "list":
        return (
          <View key={index}>
            {token.items.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.listItem}>
                • {renderInlineStyles(item.text, styles.listItem)}
              </Text>
            ))}
          </View>
        )
      default:
        return null
    }
  })
}

const PDFDocument = ({ content, chapterName }: { content: string; chapterName: string }) => {
  const parsedContent = parseMarkdown(content)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{chapterName}</Text>
          {parsedContent}
        </View>
      </Page>
    </Document>
  )
}

const PDFGenerator = ({ markdown, chapterName }: { markdown: string; chapterName: string }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const { subscriptionStatus,canDownloadPDF } = useSubscriptionStore()

  const handleDownload = async () => {
    setIsDownloading(true)
    let url = ""

    try {
      const blob = await pdf(<PDFDocument content={markdown} chapterName={chapterName} />).toBlob()
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${chapterName.replace(/\s+/g, "_")}_summary.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error in download process:", error)
    } finally {
      if (url) URL.revokeObjectURL(url)
      setIsDownloading(false)
    }
  }

  const isDisabled =
    !subscriptionStatus ||
    subscriptionStatus.subscriptionPlan === "FREE" ||
    subscriptionStatus.subscriptionPlan === "BASIC"

  return (
    <div className="flex justify-end mt-4">
      <Button
        onClick={handleDownload}
        disabled={isDownloading || isDisabled}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isDownloading ? (
          <span className="animate-spin border-2 border-t-transparent border-gray-600 rounded-full w-4 h-4"></span>
        ) : (
          <SiAdobe className="h-5 w-5" />
        )}
        <span>{isDisabled ? "Upgrade to Download" : isDownloading ? "Generating PDF..." : "Download PDF"}</span>
      </Button>
    </div>
  )
}

export default PDFGenerator

