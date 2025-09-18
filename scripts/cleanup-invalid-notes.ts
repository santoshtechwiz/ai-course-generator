import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupInvalidNotes() {
  console.log('Starting cleanup of invalid notes...')

  try {
    // Find notes that contain invalid patterns
    const invalidNotes = await prisma.bookmark.findMany({
      where: {
        OR: [
          {
            note: {
              contains: ' - ' // Course/chapter info pattern
            }
          },
          {
            note: {
              contains: 'Introduction to' // Course title pattern
            }
          },
          {
            note: {
              equals: '' // Empty notes
            }
          }
        ],
        NOT: {
          note: null
        }
      }
    })

    console.log(`Found ${invalidNotes.length} invalid notes to delete`)

    if (invalidNotes.length > 0) {
      // Delete the invalid notes
      const result = await prisma.bookmark.deleteMany({
        where: {
          OR: [
            {
              note: {
                contains: ' - '
              }
            },
            {
              note: {
                contains: 'Introduction to'
              }
            },
            {
              note: {
                equals: ''
              }
            }
          ],
          NOT: {
            note: null
          }
        }
      })

      console.log(`Deleted ${result.count} invalid notes`)
    }

    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupInvalidNotes()