import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// Define connection type for better TypeScript support
type SSEConnection = {
  controller: ReadableStreamDefaultController;
  lastSent: number;
  active: boolean;
  timeout: NodeJS.Timeout | null;
};

// Track active connections to prevent memory leaks
const activeConnections = new Map<string, SSEConnection>();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // Extract courseId from URL query parameters
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');
  
  // Validate course ID
  if (!courseId) {
    return new NextResponse('Course ID is required', { status: 400 });
  }
  
  // Create a unique connection ID for tracking
  const connectionId = `${userId || 'guest'}-${courseId}-${Date.now()}`;
  
  // Set up SSE response headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  const encoder = new TextEncoder();
  
  // Create a new response stream
  const stream = new ReadableStream({
    start: async (controller) => {
      // Store controller reference for cleanup
      activeConnections.set(connectionId, { 
        controller,
        lastSent: Date.now(),
        active: true,
        timeout: null
      });
      
      // Function to send progress data safely
      const sendProgress = async () => {
        const connection = activeConnections.get(connectionId);
        
        // Skip if connection is no longer active
        if (!connection || !connection.active) {
          return;
        }
        
        try {
          // For authenticated users, fetch and return real progress
          if (userId) {
            const progress = await prisma.courseProgress.findFirst({
              where: {
                userId: userId,
                courseId: Number(courseId),
              },
            });
            
            // Only send if controller is still active
            if (connection.active) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      progress: progress || { 
                        courseId: Number(courseId),
                        progress: 0,
                        completedChapters: [] 
                      },
                    })}\n\n`
                  )
                );
                
                // Update last sent timestamp
                connection.lastSent = Date.now();
              } catch (err) {
                console.error('Error enqueueing data:', err);
                closeConnection(connectionId);
              }
            }
          } else {
            // For unauthenticated users, send empty progress once and close
            if (connection.active) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      progress: { 
                        courseId: Number(courseId),
                        progress: 0,
                        completedChapters: [],
                        isGuest: true
                      },
                    })}\n\n`
                  )
                );
                
                // For guest users, we'll close the connection after sending initial data
                // This prevents the "controller is already closed" error
                setTimeout(() => {
                  closeConnection(connectionId);
                }, 100);
                
              } catch (err) {
                console.error('Error sending guest data:', err);
                closeConnection(connectionId);
              }
            }
          }
        } catch (error) {
          console.error('SSE error:', error);
          
          // Only send if controller is still active
          if (connection.active) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: 'Failed to fetch progress' })}\n\n`)
              );
            } catch (err) {
              // Ignore errors when sending to potentially closed controllers
            }
          }
          
          // Close connection on error to prevent repeated failures
          closeConnection(connectionId);
        }
      };
      
      // Function to safely close the connection
      const closeConnection = (id: string) => {
        const connection = activeConnections.get(id);
        if (connection && connection.active) {
          connection.active = false;
          
          // Clear any pending timeout
          if (connection.timeout) {
            clearTimeout(connection.timeout);
            connection.timeout = null;
          }
          
          try {
            // Only close if the connection is still valid
            if (controller && typeof controller.close === 'function') {
              controller.close();
            }
          } catch (error) {
            // Ignore errors when closing an already closed controller
            console.debug(`Error closing controller for ${id}:`, error);
          }
          
          // Remove from active connections map after a delay
          setTimeout(() => {
            activeConnections.delete(id);
          }, 5000);
        }
      };

      // Send initial progress data
      await sendProgress();
      
      // Set up polling interval only for authenticated users
      if (userId) {
        const connection = activeConnections.get(connectionId);
        if (connection) {
          connection.timeout = setInterval(async () => {
            const conn = activeConnections.get(connectionId);
            
            // Check if connection is still active
            if (!conn || !conn.active) {
              closeConnection(connectionId);
              return;
            }
            
            // Only send updates every 30 seconds to reduce server load
            if (Date.now() - conn.lastSent >= 30000) {
              await sendProgress();
            }
          }, 30000);
        }
      }
      
      // Handle client disconnection
      req.signal.addEventListener('abort', () => {
        closeConnection(connectionId);
      });
    },
  });

  return new NextResponse(stream, { headers });
}

// Cleanup routine to prevent memory leaks
// Run every 5 minutes to close any stale connections
setInterval(() => {
  const now = Date.now();
  for (const [id, connection] of activeConnections.entries()) {
    // Close connections inactive for more than 2 minutes
    if (now - connection.lastSent > 120000) {
      try {
        if (connection.active) {
          connection.active = false;
          if (connection.timeout) {
            clearTimeout(connection.timeout);
            connection.timeout = null;
          }
          
          // Safely access controller.close method
          if (connection.controller && typeof connection.controller.close === 'function') {
            connection.controller.close();
          }
        }
      } catch (error) {
        // Ignore errors when closing
        console.debug(`Error during cleanup for ${id}:`, error);
      } finally {
        activeConnections.delete(id);
      }
    }
  }
}, 300000);