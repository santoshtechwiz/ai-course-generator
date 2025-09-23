#!/usr/bin/env tsx
/**
 * Quiz Score Recalculation & Fix Script
 * 
 * This script fixes the quiz scoring issues found in the dashboard
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recalculateQuizScores() {
  console.log('🔧 Recalculating quiz scores...')

  try {
    // Get all quiz attempts with their question answers
    const attempts = await prisma.userQuizAttempt.findMany({
      include: {
        attemptQuestions: {
          select: {
            isCorrect: true,
            questionId: true
          }
        },
        userQuiz: {
          select: {
            title: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        user: {
          select: { name: true }
        }
      }
    })

    console.log(`\nFound ${attempts.length} quiz attempts to analyze:`)

    let fixedScores = 0
    let issuesFound = 0

    for (const attempt of attempts) {
      const totalQuestions = attempt.userQuiz._count.questions
      const correctAnswers = attempt.attemptQuestions.filter(aq => aq.isCorrect).length
      
      // Calculate what the score should be
      const calculatedScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
      const currentScore = attempt.score || 0

      console.log(`\n👤 ${attempt.user.name} - ${attempt.userQuiz.title}:`)
      console.log(`   📊 Current Score: ${currentScore}%, Calculated Score: ${calculatedScore}%`)
      console.log(`   ✅ Correct Answers: ${correctAnswers}/${totalQuestions}`)

      // Check if score needs fixing
      if (Math.abs(currentScore - calculatedScore) > 1) { // Allow 1% rounding difference
        issuesFound++
        console.log(`   ⚠️  Score mismatch detected! Fixing ${currentScore}% → ${calculatedScore}%`)
        
        try {
          await prisma.userQuizAttempt.update({
            where: { id: attempt.id },
            data: { 
              score: calculatedScore,
              accuracy: calculatedScore // Also fix accuracy
            }
          })
          fixedScores++
          console.log(`   ✅ Fixed!`)
        } catch (error) {
          console.log(`   ❌ Error fixing score: ${error}`)
        }
      } else {
        console.log(`   ✅ Score is correct`)
      }

      // Check for suspicious patterns
      if (attempt.timeSpent && attempt.timeSpent < 10 && currentScore === 0) {
        console.log(`   ⚡ Quick completion (${attempt.timeSpent}s) with 0% - possible timeout/auto-fail`)
      }
    }

    console.log(`\n📊 Recalculation Summary:`)
    console.log(`   🔍 Total attempts analyzed: ${attempts.length}`)
    console.log(`   ⚠️  Issues found: ${issuesFound}`)
    console.log(`   ✅ Scores fixed: ${fixedScores}`)

    return { attempts: attempts.length, issuesFound, fixedScores }

  } catch (error) {
    console.error('❌ Error recalculating quiz scores:', error)
    throw error
  }
}

async function analyzeQuizPatterns() {
  console.log('\n🔍 Analyzing quiz completion patterns...')

  try {
    // Check for common issues
    const [
      zeroScoreAttempts,
      quickAttempts,
      noAnswerAttempts
    ] = await Promise.all([
      // Attempts with 0% score
      prisma.userQuizAttempt.count({
        where: { score: 0 }
      }),
      
      // Attempts completed in under 10 seconds
      prisma.userQuizAttempt.count({
        where: { 
          timeSpent: { lt: 10 },
          score: 0
        }
      }),
      
      // Attempts with no answer records
      prisma.userQuizAttempt.count({
        where: { 
          attemptQuestions: { none: {} }
        }
      })
    ])

    console.log('\n📈 Quiz Pattern Analysis:')
    console.log(`   📉 Zero score attempts: ${zeroScoreAttempts}`)
    console.log(`   ⚡ Quick completion attempts (<10s + 0%): ${quickAttempts}`)
    console.log(`   ❓ Attempts with no answers: ${noAnswerAttempts}`)

    // Get user performance stats
    const userStats = await prisma.userQuizAttempt.groupBy({
      by: ['userId'],
      _count: { id: true },
      _avg: { score: true },
      having: {
        id: { _count: { gt: 0 } }
      }
    })

    console.log(`\n👥 User Performance Overview:`)
    for (const stat of userStats) {
      const user = await prisma.user.findUnique({
        where: { id: stat.userId },
        select: { name: true }
      })
      
      const avgScore = stat._avg.score || 0
      console.log(`   • ${user?.name}: ${stat._count.id} attempts, ${avgScore.toFixed(1)}% avg`)
    }

    return {
      zeroScoreAttempts,
      quickAttempts,
      noAnswerAttempts,
      userStats: userStats.length
    }

  } catch (error) {
    console.error('❌ Error analyzing quiz patterns:', error)
    throw error
  }
}

async function fixSuspiciousAttempts() {
  console.log('\n🔧 Checking for suspicious quiz attempts...')

  try {
    // Find attempts that completed very quickly with 0% score
    const suspiciousAttempts = await prisma.userQuizAttempt.findMany({
      where: {
        timeSpent: { lt: 10 },
        score: 0,
        attemptQuestions: { some: {} } // Has some answers recorded
      },
      include: {
        attemptQuestions: { select: { isCorrect: true } },
        userQuiz: { 
          select: { 
            title: true,
            _count: { select: { questions: true } }
          }
        },
        user: { select: { name: true } }
      }
    })

    console.log(`\nFound ${suspiciousAttempts.length} suspicious attempts:`)

    let recalculated = 0

    for (const attempt of suspiciousAttempts) {
      const correctAnswers = attempt.attemptQuestions.filter(aq => aq.isCorrect).length
      const totalQuestions = attempt.userQuiz._count.questions
      const actualScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

      console.log(`\n🔍 ${attempt.user.name} - ${attempt.userQuiz.title}:`)
      console.log(`   ⏱️  Completed in ${attempt.timeSpent}s`)
      console.log(`   📊 Stored Score: ${attempt.score}%, Actual Score: ${actualScore}%`)
      console.log(`   ✅ Correct: ${correctAnswers}/${totalQuestions}`)

      if (actualScore > 0) {
        await prisma.userQuizAttempt.update({
          where: { id: attempt.id },
          data: { 
            score: actualScore,
            accuracy: actualScore
          }
        })
        recalculated++
        console.log(`   ✅ Updated score to ${actualScore}%`)
      }
    }

    console.log(`\n✅ Recalculated ${recalculated} suspicious attempts`)
    return recalculated

  } catch (error) {
    console.error('❌ Error fixing suspicious attempts:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Quiz Score Recalculation & Fix')
  console.log('==================================\n')

  try {
    // Step 1: Analyze patterns
    const patterns = await analyzeQuizPatterns()

    // Step 2: Recalculate all scores
    const recalcResults = await recalculateQuizScores()

    // Step 3: Fix suspicious attempts
    const suspiciousFixed = await fixSuspiciousAttempts()

    console.log('\n🎉 Quiz Score Fix Completed!')
    console.log('============================')
    console.log(`✅ Analyzed ${recalcResults.attempts} quiz attempts`)
    console.log(`🔧 Fixed ${recalcResults.fixedScores} incorrect scores`)
    console.log(`⚡ Recalculated ${suspiciousFixed} suspicious attempts`)
    console.log(`📊 Found ${patterns.zeroScoreAttempts} zero-score attempts`)
    console.log(`👥 ${patterns.userStats} users with quiz data`)

    console.log('\n🎯 Dashboard should now show correct quiz scores!')

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

export { recalculateQuizScores, analyzeQuizPatterns, fixSuspiciousAttempts }