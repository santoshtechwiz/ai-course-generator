'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Copy, Check, Code2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from '@/hooks/use-toast'


export default function CodeGenerator() {
  const [input, setInput] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleGenerateCode = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a description for the code you want to generate.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setCode('')
    setDescription('')

    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullText += chunk

        const codeMatch = fullText.match(/```(.*?)```/s)
        const codeContent = codeMatch ? codeMatch[1].trim() : ''
        const descriptionContent = fullText.replace(/```(.*?)```/s, '').trim()

        setCode(codeContent)
        setDescription(descriptionContent)
      }

      toast({
        title: "Code generated",
        description: "Your code has been successfully generated.",
      })
    } catch (error) {
      setDescription('Error generating code.')
      toast({
        title: "Error",
        description: "An error occurred while generating the code.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      toast({
        title: "Copied",
        description: "Code copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.h1 
        className="text-4xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Sparkles className="inline-block mr-2 text-yellow-400" />
        AI Code Generator
      </motion.h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code2 className="mr-2" />
              Input
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              className="w-full h-full resize-none font-mono text-sm"
              placeholder="Describe the code you want to generate..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleGenerateCode}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Output
              {code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="ml-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              )} 
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <Tabs defaultValue="code" className="h-full flex flex-col">
              <TabsList>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
              </TabsList>
              <TabsContent value="code" className="flex-grow">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <AnimatePresence mode="wait">
                    {code ? (
                      <motion.div
                        key="code"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <SyntaxHighlighter
                          language="javascript"
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            borderRadius: '0.5rem',
                          }}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-muted-foreground"
                      >
                        Generated code will appear here...
                      </motion.p>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="description" className="flex-grow">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <AnimatePresence mode="wait">
                    {description ? (
                      <motion.div
                        key="description"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <p className="whitespace-pre-wrap">{description}</p>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-muted-foreground"
                      >
                        Description will appear here...
                      </motion.p>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}