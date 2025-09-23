#!/usr/bin/env tsx
/**
 * Simple Dashboard Progress Checker & Fixer
 * 
 * This script checks for common dashboard progress display issues and fixes them
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProgressIssues() {
  console.log('🔍 Checking dashboard progress issues...')

  try {
    // 1. Check for courses with invalid progress values
    console.log('\n📚 Checking CourseProgress issues...')
    const invalidCourseProgress = await prisma.courseProgress.findMany({
      where: {
        OR: [
          { progress: { lt: 0 } },
          { progress: { gt: 1 } },
          { timeSpent: { lt: 0 } }
        ]
      },
      include: {
        course: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } }
      }
    })

    if (invalidCourseProgress.length > 0) {
      console.log(`❌ Found ${invalidCourseProgress.length} courses with invalid progress:`)
      invalidCourseProgress.forEach(cp => {
        console.log(`  - User: ${cp.user.name}, Course: ${cp.course.title}`)
        console.log(`    Progress: ${cp.progress}, TimeSpent: ${cp.timeSpent}`)
      })
    } else {
      console.log('✅ All course progress values look good')
    }

    // 2. Check for completion status inconsistencies
    console.log('\n🎯 Checking completion status inconsistencies...')
    const completionIssues = await prisma.courseProgress.findMany({
      where: {
        OR: [
          { isCompleted: true, progress: { lt: 0.95 } },
          { isCompleted: false, progress: { gte: 1 } }
        ]
      },
      include: {
        course: { select: { title: true } },
        user: { select: { name: true } }
      }
    })

    if (completionIssues.length > 0) {
      console.log(`❌ Found ${completionIssues.length} completion status issues:`)
      completionIssues.forEach(cp => {
        console.log(`  - User: ${cp.user.name}, Course: ${cp.course.title}`)
        console.log(`    isCompleted: ${cp.isCompleted}, Progress: ${cp.progress}`)
      })
    } else {
      console.log('✅ All completion statuses look consistent')
    }

    // 3. Check for chapter progress issues
    console.log('\n📖 Checking ChapterProgress issues...')
    const invalidChapterProgress = await prisma.chapterProgress.findMany({
      where: {
        OR: [
          { lastProgress: { lt: 0 } },
          { lastProgress: { gt: 1 } },
          { timeSpent: { lt: 0 } }
        ]
      },
      include: {
        chapter: { select: { title: true } },
        course: { select: { title: true } },
        user: { select: { name: true } }
      }
    })

    if (invalidChapterProgress.length > 0) {
      console.log(`❌ Found ${invalidChapterProgress.length} chapters with invalid progress:`)
      invalidChapterProgress.forEach(cp => {
        console.log(`  - User: ${cp.user.name}, Course: ${cp.course.title}`)
        console.log(`    Chapter: ${cp.chapter.title}, Progress: ${cp.lastProgress}, TimeSpent: ${cp.timeSpent}`)
      })
    } else {
      console.log('✅ All chapter progress values look good')
    }

    // 4. Check for quiz score issues
    console.log('\n🧠 Checking Quiz score issues...')
    const invalidQuizScores = await prisma.userQuizAttempt.findMany({
      where: {
        OR: [
          { score: { lt: 0 } },
          { score: { gt: 100 } },
          { timeSpent: { lt: 0 } }
        ]
      },
      include: {
        userQuiz: { select: { title: true } },
        user: { select: { name: true } }
      }
    })

    if (invalidQuizScores.length > 0) {
      console.log(`❌ Found ${invalidQuizScores.length} quizzes with invalid scores:`)
      invalidQuizScores.forEach(qa => {
        console.log(`  - User: ${qa.user?.name}, Quiz: ${qa.userQuiz?.title}`)
        console.log(`    Score: ${qa.score}, TimeSpent: ${qa.timeSpent}`)
      })
    } else {
      console.log('✅ All quiz scores look good')
    }

    // 5. Check for missing course progress records
    console.log('\n🔍 Checking for missing progress records...')
    const usersWithCourses = await prisma.user.findMany({
      where: {
        courses: { some: {} }
      },
      include: {
        courses: { select: { id: true } },
        courseProgress: { select: { courseId: true } }
      }
    })

    let missingProgressCount = 0
    for (const user of usersWithCourses) {
      const courseIds = user.courses.map(c => c.id)
      const progressCourseIds = user.courseProgress.map(cp => cp.courseId)
      const missingCourses = courseIds.filter(id => !progressCourseIds.includes(id))
      missingProgressCount += missingCourses.length
    }

    if (missingProgressCount > 0) {
      console.log(`❌ Found ${missingProgressCount} missing course progress records`)
    } else {
      console.log('✅ All courses have progress records')
    }

    console.log('\n📊 Summary:')
    console.log(`  Invalid course progress: ${invalidCourseProgress.length}`)
    console.log(`  Completion inconsistencies: ${completionIssues.length}`)
    console.log(`  Invalid chapter progress: ${invalidChapterProgress.length}`)
    console.log(`  Invalid quiz scores: ${invalidQuizScores.length}`)
    console.log(`  Missing progress records: ${missingProgressCount}`)

    return {
      invalidCourseProgress,
      completionIssues,
      invalidChapterProgress,
      invalidQuizScores,
      missingProgressCount
    }

  } catch (error) {
    console.error('❌ Error checking progress issues:', error)
    throw error
  }
}

async function fixProgressIssues() {
  console.log('🔧 Fixing dashboard progress issues...')

  try {
    let fixed = 0

    // 1. Fix invalid course progress values
    console.log('\n📚 Fixing invalid course progress values...')
    const fixedCourseProgress = await prisma.courseProgress.updateMany({
      where: { progress: { lt: 0 } },
      data: { progress: 0 }
    })
    fixed += fixedCourseProgress.count

    const fixedCourseProgressMax = await prisma.courseProgress.updateMany({
      where: { progress: { gt: 1 } },
      data: { progress: 1 }
    })
    fixed += fixedCourseProgressMax.count

    const fixedCourseTimeSpent = await prisma.courseProgress.updateMany({
      where: { timeSpent: { lt: 0 } },
      data: { timeSpent: 0 }
    })
    fixed += fixedCourseTimeSpent.count

    console.log(`✅ Fixed ${fixedCourseProgress.count + fixedCourseProgressMax.count + fixedCourseTimeSpent.count} course progress issues`)

    // 2. Fix completion status inconsistencies
    console.log('\n🎯 Fixing completion status inconsistencies...')
    const fixedIncompleteMarkedComplete = await prisma.courseProgress.updateMany({
      where: { isCompleted: true, progress: { lt: 0.95 } },
      data: { isCompleted: false }
    })
    fixed += fixedIncompleteMarkedComplete.count

    const fixedCompleteNotMarked = await prisma.courseProgress.updateMany({
      where: { isCompleted: false, progress: { gte: 1 } },
      data: { isCompleted: true }
    })
    fixed += fixedCompleteNotMarked.count

    console.log(`✅ Fixed ${fixedIncompleteMarkedComplete.count + fixedCompleteNotMarked.count} completion status issues`)

    // 3. Fix chapter progress values
    console.log('\n📖 Fixing chapter progress values...')
    const fixedChapterProgressMin = await prisma.chapterProgress.updateMany({
      where: { lastProgress: { lt: 0 } },
      data: { lastProgress: 0 }
    })
    fixed += fixedChapterProgressMin.count

    const fixedChapterProgressMax = await prisma.chapterProgress.updateMany({
      where: { lastProgress: { gt: 1 } },
      data: { lastProgress: 1 }
    })
    fixed += fixedChapterProgressMax.count

    const fixedChapterTimeSpent = await prisma.chapterProgress.updateMany({
      where: { timeSpent: { lt: 0 } },
      data: { timeSpent: 0 }
    })
    fixed += fixedChapterTimeSpent.count

    console.log(`✅ Fixed ${fixedChapterProgressMin.count + fixedChapterProgressMax.count + fixedChapterTimeSpent.count} chapter progress issues`)

    // 4. Fix quiz scores
    console.log('\n🧠 Fixing quiz score issues...')
    const fixedQuizScoresMin = await prisma.userQuizAttempt.updateMany({
      where: { score: { lt: 0 } },
      data: { score: 0 }
    })
    fixed += fixedQuizScoresMin.count

    const fixedQuizScoresMax = await prisma.userQuizAttempt.updateMany({
      where: { score: { gt: 100 } },
      data: { score: 100 }
    })
    fixed += fixedQuizScoresMax.count

    const fixedQuizTimeSpent = await prisma.userQuizAttempt.updateMany({
      where: { timeSpent: { lt: 0 } },
      data: { timeSpent: 0 }
    })
    fixed += fixedQuizTimeSpent.count

    console.log(`✅ Fixed ${fixedQuizScoresMin.count + fixedQuizScoresMax.count + fixedQuizTimeSpent.count} quiz score issues`)

    // 5. Create missing progress records
    console.log('\n🔍 Creating missing progress records...')
    const usersWithCourses = await prisma.user.findMany({
      where: {
        courses: { some: {} }
      },
      include: {
        courses: { select: { id: true } },
        courseProgress: { select: { courseId: true } }
      }
    })

    let createdProgress = 0
    for (const user of usersWithCourses) {
      const courseIds = user.courses.map(c => c.id)
      const progressCourseIds = user.courseProgress.map(cp => cp.courseId)
      const missingCourses = courseIds.filter(id => !progressCourseIds.includes(id))
      
      for (const courseId of missingCourses) {
        await prisma.courseProgress.create({
          data: {
            userId: user.id,
            courseId,
            currentChapterId: 1,
            progress: 0,
            timeSpent: 0,
            isCompleted: false
          }
        })
        createdProgress++
      }
    }

    console.log(`✅ Created ${createdProgress} missing progress records`)
    fixed += createdProgress

    console.log(`\n🎉 Total fixes applied: ${fixed}`)
    return fixed

  } catch (error) {
    console.error('❌ Error fixing progress issues:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Dashboard Progress Checker & Fixer')
  console.log('=====================================\n')

  try {
    // Step 1: Check for issues
    const issues = await checkProgressIssues()
    
    const totalIssues = issues.invalidCourseProgress.length + 
                       issues.completionIssues.length + 
                       issues.invalidChapterProgress.length + 
                       issues.invalidQuizScores.length + 
                       issues.missingProgressCount

    if (totalIssues === 0) {
      console.log('\n🎉 No issues found! Dashboard progress data looks perfect.')
      return
    }

    console.log(`\n⚠️  Found ${totalIssues} total issues that need fixing.`)
    console.log('\nDo you want to fix these issues automatically? (y/N)')
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise<string>((resolve) => {
      readline.question('', resolve)
    })
    readline.close()

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const fixedCount = await fixProgressIssues()
      console.log(`\n🎉 Successfully fixed ${fixedCount} issues!`)
      console.log('✅ Dashboard progress data has been cleaned up.')
    } else {
      console.log('\n❌ No changes made. Issues remain in the database.')
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { checkProgressIssues, fixProgressIssues }