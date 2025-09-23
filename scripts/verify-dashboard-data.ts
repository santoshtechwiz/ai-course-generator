#!/usr/bin/env tsx
/**
 * Dashboard Progress Verification & Cache Reset
 * 
 * This script verifies dashboard calculations and refreshes cached data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyProgressCalculations() {
  console.log('🔍 Verifying progress calculations...')

  try {
    // Get all users with progress data
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { courseProgress: { some: {} } },
          { userQuizAttempts: { some: {} } }
        ]
      },
      include: {
        courseProgress: {
          include: {
            course: { select: { title: true, slug: true } }
          }
        },
        userQuizAttempts: {
          include: {
            userQuiz: { select: { title: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            courseProgress: true,
            userQuizAttempts: true
          }
        }
      }
    })

    console.log(`\n📊 Found ${users.length} users with progress data:`)

    for (const user of users) {
      console.log(`\n👤 User: ${user.name || user.email}`)
      console.log(`   📚 Course Progress Records: ${user._count.courseProgress}`)
      console.log(`   🧠 Quiz Attempts: ${user._count.userQuizAttempts}`)

      // Check course progress
      if (user.courseProgress.length > 0) {
        const completedCourses = user.courseProgress.filter(cp => cp.isCompleted).length
        const avgProgress = user.courseProgress.reduce((sum, cp) => sum + cp.progress, 0) / user.courseProgress.length
        
        console.log(`   ✅ Completed Courses: ${completedCourses}/${user.courseProgress.length}`)
        console.log(`   📈 Average Progress: ${(avgProgress * 100).toFixed(1)}%`)

        // Show recent progress
        const recentProgress = user.courseProgress
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3)

        console.log(`   🕒 Recent Progress:`)
        recentProgress.forEach(cp => {
          console.log(`      - ${cp.course.title}: ${(cp.progress * 100).toFixed(1)}% ${cp.isCompleted ? '✅' : '⏳'}`)
        })
      }

      // Check quiz performance
      if (user.userQuizAttempts.length > 0) {
        const avgScore = user.userQuizAttempts.reduce((sum, qa) => sum + (qa.score || 0), 0) / user.userQuizAttempts.length
        const highestScore = Math.max(...user.userQuizAttempts.map(qa => qa.score || 0))
        const totalTimeSpent = user.userQuizAttempts.reduce((sum, qa) => sum + (qa.timeSpent || 0), 0)

        console.log(`   🎯 Quiz Performance:`)
        console.log(`      - Average Score: ${avgScore.toFixed(1)}%`)
        console.log(`      - Highest Score: ${highestScore.toFixed(1)}%`)
        console.log(`      - Total Time: ${Math.round(totalTimeSpent / 60)} minutes`)

        // Show recent attempts
        const recentAttempts = user.userQuizAttempts.slice(0, 3)
        console.log(`   🕒 Recent Quiz Attempts:`)
        recentAttempts.forEach(qa => {
          console.log(`      - ${qa.userQuiz?.title}: ${(qa.score || 0).toFixed(1)}% (${qa.timeSpent || 0}s)`)
        })
      }
    }

    return users

  } catch (error) {
    console.error('❌ Error verifying progress calculations:', error)
    throw error
  }
}

async function refreshDashboardStats() {
  console.log('\n🔄 Refreshing dashboard statistics...')

  try {
    // Recalculate all course progress percentages
    console.log('📚 Recalculating course progress...')
    const courseProgressRecords = await prisma.courseProgress.findMany({
      include: {
        course: {
          include: {
            chapters: { select: { id: true } }
          }
        },
        user: {
          include: {
            chapterProgress: {
              where: { courseId: { not: null } }
            }
          }
        }
      }
    })

    let updatedCourseProgress = 0

    for (const cp of courseProgressRecords) {
      const totalChapters = cp.course.chapters.length
      if (totalChapters === 0) continue

      // Get user's chapter progress for this course
      const userChapterProgress = cp.user.chapterProgress.filter(
        chap => chap.courseId === cp.courseId
      )

      const completedChapters = userChapterProgress.filter(
        chap => chap.isCompleted
      ).length

      const calculatedProgress = totalChapters > 0 ? completedChapters / totalChapters : 0
      const shouldBeCompleted = calculatedProgress >= 1

      // Update if different
      if (Math.abs(cp.progress - calculatedProgress) > 0.01 || cp.isCompleted !== shouldBeCompleted) {
        await prisma.courseProgress.update({
          where: { id: cp.id },
          data: {
            progress: calculatedProgress,
            isCompleted: shouldBeCompleted
          }
        })
        updatedCourseProgress++
        console.log(`   ✅ Updated ${cp.course.title} progress: ${(calculatedProgress * 100).toFixed(1)}%`)
      }
    }

    console.log(`✅ Updated ${updatedCourseProgress} course progress records`)

    // Verify quiz attempt scores are within valid range
    console.log('\n🧠 Verifying quiz attempt scores...')
    const invalidScores = await prisma.userQuizAttempt.findMany({
      where: {
        OR: [
          { score: { lt: 0 } },
          { score: { gt: 100 } }
        ]
      }
    })

    if (invalidScores.length > 0) {
      console.log(`⚠️  Found ${invalidScores.length} quiz attempts with invalid scores`)
      
      // Fix them
      const fixedScores = await prisma.userQuizAttempt.updateMany({
        where: { score: { lt: 0 } },
        data: { score: 0 }
      })

      const fixedMaxScores = await prisma.userQuizAttempt.updateMany({
        where: { score: { gt: 100 } },
        data: { score: 100 }
      })

      console.log(`✅ Fixed ${fixedScores.count + fixedMaxScores.count} invalid quiz scores`)
    } else {
      console.log('✅ All quiz scores are within valid range')
    }

    return {
      updatedCourseProgress,
      fixedScores: invalidScores.length
    }

  } catch (error) {
    console.error('❌ Error refreshing dashboard stats:', error)
    throw error
  }
}

async function generateDashboardReport() {
  console.log('\n📊 Generating Dashboard Health Report...')

  try {
    const [
      totalUsers,
      usersWithCourseProgress,
      usersWithQuizAttempts,
      totalCourseProgress,
      completedCourses,
      totalQuizAttempts,
      avgQuizScore
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { courseProgress: { some: {} } } }),
      prisma.user.count({ where: { userQuizAttempts: { some: {} } } }),
      prisma.courseProgress.count(),
      prisma.courseProgress.count({ where: { isCompleted: true } }),
      prisma.userQuizAttempt.count(),
      prisma.userQuizAttempt.aggregate({ _avg: { score: true } })
    ])

    console.log('\n🎯 Dashboard Health Summary:')
    console.log('=====================================')
    console.log(`👥 Total Users: ${totalUsers}`)
    console.log(`📚 Users with Course Progress: ${usersWithCourseProgress}`)
    console.log(`🧠 Users with Quiz Attempts: ${usersWithQuizAttempts}`)
    console.log(`📈 Total Course Progress Records: ${totalCourseProgress}`)
    console.log(`✅ Completed Courses: ${completedCourses}`)
    console.log(`🎯 Total Quiz Attempts: ${totalQuizAttempts}`)
    console.log(`📊 Average Quiz Score: ${(avgQuizScore._avg.score || 0).toFixed(1)}%`)
    
    const courseCompletionRate = totalCourseProgress > 0 ? (completedCourses / totalCourseProgress * 100).toFixed(1) : '0'
    console.log(`🏆 Course Completion Rate: ${courseCompletionRate}%`)

    return {
      totalUsers,
      usersWithCourseProgress,
      usersWithQuizAttempts,
      totalCourseProgress,
      completedCourses,
      totalQuizAttempts,
      avgQuizScore: avgQuizScore._avg.score || 0,
      completionRate: parseFloat(courseCompletionRate)
    }

  } catch (error) {
    console.error('❌ Error generating dashboard report:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Dashboard Progress Verification & Cache Reset')
  console.log('================================================\n')

  try {
    // Step 1: Verify current calculations
    const users = await verifyProgressCalculations()

    // Step 2: Refresh dashboard stats
    const refreshResults = await refreshDashboardStats()

    // Step 3: Generate final report
    const report = await generateDashboardReport()

    console.log('\n🎉 Dashboard verification completed successfully!')
    console.log(`✅ Processed ${users.length} users`)
    console.log(`✅ Updated ${refreshResults.updatedCourseProgress} course progress records`)
    console.log(`✅ Fixed ${refreshResults.fixedScores} invalid quiz scores`)
    console.log('\n📋 Dashboard is now ready with clean, accurate data!')

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

export { verifyProgressCalculations, refreshDashboardStats, generateDashboardReport }