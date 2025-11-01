#!/usr/bin/env node

/**
 * Cleanup script to remove invalid notes that contain chapter information
 * Run with: npx tsx scripts/cleanup-invalid-notes.ts
 */

const { PrismaClient } = require('@prisma/client');

async function cleanupInvalidNotes() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting cleanup of invalid notes...');

    // Get all chapter titles for comparison
    const chapters = await prisma.chapter.findMany({
      select: { title: true }
    });
    const chapterTitles = chapters.map((c: { title: string }) => c.title);

    // Find all bookmarks with notes that match invalid patterns
    const invalidNotes = await prisma.bookmark.findMany({
      where: {
        note: { not: null, notIn: [''] },
        OR: [
          { note: { contains: ' - ' } },
          { note: { contains: 'Introduction to' } },
          { note: { contains: 'Bookmark at ' } },
          { note: { contains: 'Chapter ' } },
          { note: { in: chapterTitles } } // Notes that exactly match chapter titles
        ]
      },
      select: { id: true, note: true }
    });

    console.log(`Found ${invalidNotes.length} invalid notes to delete`);

    if (invalidNotes.length > 0) {
      // Show a sample of what will be deleted
      console.log('\nSample of notes to be deleted:');
      invalidNotes.slice(0, 10).forEach((note: { id: number; note: string | null }) => {
        console.log(`- ID ${note.id}: ${note.note?.substring(0, 100)}`);
      });

      // Delete the invalid notes
      const deleteResult = await prisma.bookmark.deleteMany({
        where: {
          id: { in: invalidNotes.map((n: { id: number; note: string | null }) => n.id) }
        }
      });

      console.log(`\nDeleted ${deleteResult.count} invalid notes`);
    } else {
      console.log('No invalid notes found to delete');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupInvalidNotes().then(() => {
  console.log('Cleanup completed successfully');
}).catch(console.error);