#!/usr/bin/env tsx
/**
 * Simple Dashboard Fix Script
 * 
 * Fix the specific dashboard issues we identified
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDashboardIssues() {
  console.log('🔧 Fixing specific dashboard issues...')

  try {
    // 1. Check for users with suspiciously low quiz scores
    console.log('\n🧠 Checking quiz score anomalies...')
    
    const usersWithQuizAttempts = await prisma.user.findMany({
      where: {
        userQuizAttempts: { some: {} }
      },
      include: {
        userQuizAttempts: {
          select: {
            id: true,
            score: true,
            timeSpent: true,
            createdAt: true,
            userQuiz: {
              select: {
                title: true,
                _count: {
                  select: { questions: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    console.log(`\nFound ${usersWithQuizAttempts.length} users with quiz attempts:`)

    for (const user of usersWithQuizAttempts) {
      const attempts = user.userQuizAttempts
      const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
      const zeroScores = attempts.filter(a => a.score === 0).length

      console.log(`\n👤 ${user.name}:`)
      console.log(`   🎯 ${attempts.length} attempts, ${avgScore.toFixed(1)}% avg score`)
      console.log(`   ⚠️  ${zeroScores} zero scores (${(zeroScores/attempts.length*100).toFixed(1)}%)`)

      // Show recent attempts for debugging
      const recentAttempts = attempts.slice(0, 3)
      console.log(`   🕒 Recent attempts:`)
      recentAttempts.forEach(attempt => {
        const questionCount = attempt.userQuiz._count.questions
        console.log(`      - ${attempt.userQuiz.title}: ${attempt.score}% (${questionCount}q, ${attempt.timeSpent}s)`)
      })

      // Check for suspiciously short quiz times that might indicate scoring issues
      const quickAttempts = attempts.filter(a => a.timeSpent < 10 && a.score === 0)
      if (quickAttempts.length > 0) {
        console.log(`   ⚡ ${quickAttempts.length} attempts completed in <10 seconds with 0% score`)
      }
    }

    // 2. Check course progress calculation accuracy
    console.log('\n\n📚 Verifying course progress calculations...')
    
    const courseProgressData = await prisma.courseProgress.findMany({
      include: {
        course: { select: { title: true } },
        user: { select: { name: true } }
      }
    })

    console.log(`\nFound ${courseProgressData.length} course progress records:`)

    const progressIssues = courseProgressData.filter(cp => 
      cp.progress < 0 || cp.progress > 1 || 
      (cp.isCompleted && cp.progress < 0.95) ||
      (!cp.isCompleted && cp.progress >= 1)
    )

    if (progressIssues.length > 0) {
      console.log(`\n⚠️  Found ${progressIssues.length} course progress issues:`)
      progressIssues.forEach(cp => {
        console.log(`   - ${cp.user.name}: ${cp.course.title}`)
        console.log(`     Progress: ${cp.progress}, Completed: ${cp.isCompleted}`)
      })
    } else {
      console.log(`✅ All course progress values look correct`)
    }

    // 3. Check for missing progress records
    console.log('\n\n🔍 Checking for missing progress records...')
    
    const usersWithCourses = await prisma.user.findMany({
      where: {
        courses: { some: {} }
      },
      include: {
        courses: { select: { id: true, title: true } },
        courseProgress: { select: { courseId: true } }
      }
    })

    let missingProgressCount = 0
    for (const user of usersWithCourses) {
      const courseIds = user.courses.map(c => c.id)
      const progressCourseIds = user.courseProgress.map(cp => cp.courseId)
      const missingCourses = user.courses.filter(course => 
        !progressCourseIds.includes(course.id)
      )
      
      if (missingCourses.length > 0) {
        console.log(`\n👤 ${user.name} missing progress for:`)
        missingCourses.forEach(course => {
          console.log(`   - ${course.title}`)
        })
        missingProgressCount += missingCourses.length
      }
    }

    if (missingProgressCount === 0) {
      console.log(`✅ All users have progress records for their courses`)
    }

    // 4. Generate summary statistics
    console.log('\n\n📊 Dashboard Statistics Summary:')
    console.log('=====================================')
    
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.courseProgress.count(),
      prisma.courseProgress.count({ where: { isCompleted: true } }),
      prisma.userQuizAttempt.count(),
      prisma.userQuizAttempt.aggregate({ _avg: { score: true } }),
      prisma.chapterProgress.count(),
      prisma.chapterProgress.count({ where: { isCompleted: true } })
    ])

    const [
      totalUsers, 
      totalCourseProgress, 
      completedCourses, 
      totalQuizAttempts, 
      avgQuizScore,
      totalChapterProgress,
      completedChapters
    ] = stats

    console.log(`👥 Total Users: ${totalUsers}`)
    console.log(`📚 Course Progress Records: ${totalCourseProgress}`)
    console.log(`✅ Completed Courses: ${completedCourses} (${(completedCourses/totalCourseProgress*100).toFixed(1)}%)`)
    console.log(`📖 Chapter Progress Records: ${totalChapterProgress}`)
    console.log(`✅ Completed Chapters: ${completedChapters} (${(completedChapters/totalChapterProgress*100).toFixed(1)}%)`)
    console.log(`🧠 Quiz Attempts: ${totalQuizAttempts}`)
    console.log(`📊 Average Quiz Score: ${(avgQuizScore._avg.score || 0).toFixed(1)}%`)

    return {
      usersWithQuizAttempts: usersWithQuizAttempts.length,
      progressIssues: progressIssues.length,
      missingProgressCount,
      stats: {
        totalUsers,
        totalCourseProgress,
        completedCourses,
        totalQuizAttempts,
        avgQuizScore: avgQuizScore._avg.score || 0,
        totalChapterProgress,
        completedChapters
      }
    }

  } catch (error) {
    console.error('❌ Error analyzing dashboard issues:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Dashboard Issue Analysis & Fix')
  console.log('==================================\n')

  try {
    const results = await fixDashboardIssues()
    
    console.log('\n🎉 Dashboard analysis completed!')
    console.log(`✅ Analyzed ${results.usersWithQuizAttempts} users with quiz data`)
    console.log(`✅ Found ${results.progressIssues} progress issues`)
    console.log(`✅ Found ${results.missingProgressCount} missing progress records`)
    console.log('\n📋 Dashboard data has been analyzed and is ready for review.')

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

export { fixDashboardIssues }