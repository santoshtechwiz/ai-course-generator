// app/unsubscribed/page.tsx (Next.js 13+ App Router example)
'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function UnsubscribedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="text-center shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="text-green-600"
            >
              <CheckCircle size={64} strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-semibold text-foreground">You're Unsubscribed</h2>
            <p className="text-muted-foreground text-sm">
              You’ve been successfully removed from our mailing list. Sorry to see you go!
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
