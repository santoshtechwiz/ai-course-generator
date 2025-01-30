import type React from "react"
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"

// Register custom fonts if needed
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
})

interface StyleConfig {
  colors: {
    primary: string
    secondary: string
    text: string
    background: string
  }
  fonts: {
    title: string
    body: string
  }
}

interface ContentSection {
  type: "text" | "image" | "table"
  content: string | string[][] | { src: string; width: number; height: number }
  style?: "title" | "subtitle" | "body"
}

interface PDFGeneratorProps {
  title: string
  content: ContentSection[]
  styleConfig: StyleConfig
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ title, content, styleConfig }) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: styleConfig.colors.background,
      padding: 30,
    },
    section: {
      margin: 10,
      padding: 10,
    },
    title: {
      fontSize: 24,
      fontFamily: styleConfig.fonts.title,
      color: styleConfig.colors.primary,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      fontFamily: styleConfig.fonts.title,
      color: styleConfig.colors.secondary,
      marginBottom: 5,
    },
    body: {
      fontSize: 12,
      fontFamily: styleConfig.fonts.body,
      color: styleConfig.colors.text,
    },
    table: {
      display: "table",
      width: "auto",
      borderStyle: "solid",
      borderColor: styleConfig.colors.primary,
      borderWidth: 1,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    tableRow: {
      margin: "auto",
      flexDirection: "row",
    },
    tableCol: {
      width: "25%",
      borderStyle: "solid",
      borderColor: styleConfig.colors.primary,
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    tableCell: {
      margin: "auto",
      marginTop: 5,
      fontSize: 10,
    },
  })

  const renderContent = (item: ContentSection, index: number) => {
    switch (item.type) {
      case "text":
        return (
          <Text key={index} style={styles[item.style || "body"]}>
            {item.content as string}
          </Text>
        )
      case "image":
        const imgContent = item.content as { src: string; width: number; height: number }
        return (
          <Image
            key={index}
            src={imgContent.src || "/placeholder.svg"}
            style={{ width: imgContent.width, height: imgContent.height }}
          />
        )
      case "table":
        const tableContent = item.content as string[][]
        return (
          <View key={index} style={styles.table}>
            {tableContent.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow}>
                {row.map((cell, cellIndex) => (
                  <View key={cellIndex} style={styles.tableCol}>
                    <Text style={styles.tableCell}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )
      default:
        return null
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{title}</Text>
          {content.map((item, index) => renderContent(item, index))}
        </View>
      </Page>
    </Document>
  )
}

export default PDFGenerator

