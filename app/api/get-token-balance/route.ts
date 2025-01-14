import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'



export async function GET() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const userSubscription = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    return NextResponse.json({ tokens: userSubscription?.credits ?? 0 })
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
