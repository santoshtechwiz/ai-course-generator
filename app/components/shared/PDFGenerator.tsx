"use client"

import React, { useState } from "react"
import { Document, Page, Text, View, StyleSheet, PDFViewer } from "@react-pdf/renderer"
import ReactMarkdown from "react-markdown"

import { Card, CardContent } from "@/components/ui/card"
import DynamicPDFDownloadButton from "./DynamicPDFDownloadButton"

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: "Helvetica" },
  section: { marginBottom: 10 },
  title: { fontSize: 18, marginBottom: 10 },
  content: { fontSize: 12, lineHeight: 1.5 },
})

const PDFDocument = ({ content, chapterName }: { content: string; chapterName: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{chapterName}</Text>
        <Text style={styles.content}>{content}</Text>
      </View>
    </Page>
  </Document>
)

const PDFGenerator = ({ markdown, chapterName }: { markdown: string; chapterName: string }) => {
  const [showPDFPreview, setShowPDFPreview] = useState(false)

  const togglePDFPreview = () => {
    setShowPDFPreview(!showPDFPreview)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <ReactMarkdown className="prose dark:prose-invert">{markdown}</ReactMarkdown>
        </CardContent>
      </Card>
      <div className="flex justify-end items-center">
        <DynamicPDFDownloadButton
          document={<PDFDocument content={markdown} chapterName={chapterName} />}
          fileName={`${chapterName.replace(/\s+/g, '_')}_summary.pdf`}
        />
      </div>
    
    </div>
  )
}

export default PDFGenerator
