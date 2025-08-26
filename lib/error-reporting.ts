import { logger } from './logger'

/**
 * Error reporting utility for error boundaries
 * Sends errors to logging service in production
 */
export function reportError(error: Error, errorInfo?: {componentStack?: string}) {
  if (process.env.NODE_ENV === "production") {
    // Use window.Sentry if available
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope: any) => {
        if (errorInfo?.componentStack) {
          scope.setExtra('componentStack', errorInfo.componentStack);
        }
        (window as any).Sentry.captureException(error);
      });
    }
  }

  // Always log to console and our logger
  logger.error('[Error Boundary]', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
  });
}
