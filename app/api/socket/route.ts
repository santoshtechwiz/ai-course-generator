import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

global.io = global.io || {}

export async function GET(req: NextApiRequest) {
  
  if (!global.io.handler) {
    const httpServer = new NetServer()
    global.io.handler = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    })

    global.io.handler.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('join-course', (courseId: string) => {
        socket.join(`course:${courseId}`)
        console.log(`Socket ${socket.id} joined course:${courseId}`)
      })

      socket.on('progress-update', (data) => {
        socket.to(`progress_${data.userId}_${data.courseId}`).emit('progress-updated', data)
        console.log(`Progress updated for course:${data.courseId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    })
  }

  return new NextResponse(null, { status: 200 })
}

