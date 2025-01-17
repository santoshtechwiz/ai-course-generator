import { prisma } from '@/lib/db'
import { NextApiRequest, NextApiResponse } from 'next'



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { courseId } = req.query

  if (req.method === 'GET') {
    try {
      const chapters = await prisma.chapter.findMany({
        where: {
          unit: {
            courseId: Number(courseId),
          },
        },
        select: {
          id: true,
          name: true,
          youtubeSearchQuery: true,
        },
        orderBy: {
          id: 'asc',
        },
      })

      res.status(200).json(chapters)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching chapters', error })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

