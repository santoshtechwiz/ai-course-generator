import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  error?: Error | null
}

export function ErrorMessage({ message, error }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="max-w-lg mx-auto my-8">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {error && process.env.NODE_ENV === 'development' && (
          <pre className="mt-2 text-xs bg-red-950 p-2 rounded overflow-x-auto">
            {error.message}
          </pre>
        )}
      </AlertDescription>
    </Alert>
  )
}
