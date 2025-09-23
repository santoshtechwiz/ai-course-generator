#!/usr/bin/env tsx
/**
 * Dashboard Progress Data Cleanup Script
 * 
 * This script identifies and fixes data inconsistencies in:
 * 1. Course progress calculations
 * 2. Chapter progress tracking
 * 3. Quiz completion status
 * 4. Time spent calculations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProgressIssue {
  type: 'course' | 'chapter' | 'quiz'
  id: string | number
  issue: string
  currentValue: any
  suggestedValue: any
}

async function analyzeProgressIssues(): Promise<ProgressIssue[]> {
  console.log('🔍 Analyzing progress data inconsistencies...')
  const issues: ProgressIssue[] = []

  try {
    // 1. Check CourseProgress inconsistencies
    console.log('📚 Checking course progress issues...')
    const courseProgressIssues = await prisma.courseProgress.findMany({
      include: {
        course: {
          include: {
            courseUnits: {
              include: {
                chapters: true
              }
            }
          }
        }
      }
    })

    for (const cp of courseProgressIssues) {
      // Calculate expected progress based on chapters
      const totalChapters = cp.course.courseUnits.reduce((sum, unit) => sum + unit.chapters.length, 0)
      
      // Check if progress value makes sense
      if (cp.progress < 0 || cp.progress > 1) {
        issues.push({
          type: 'course',
          id: cp.id,
          issue: 'Progress value out of bounds (should be 0-1)',
          currentValue: cp.progress,
          suggestedValue: Math.max(0, Math.min(1, cp.progress))
        })
      }

      // Check completion status consistency
      if (cp.isCompleted && cp.progress < 0.95) {
        issues.push({
          type: 'course',
          id: cp.id,
          issue: 'Marked completed but progress < 95%',
          currentValue: { isCompleted: cp.isCompleted, progress: cp.progress },
          suggestedValue: { isCompleted: false, progress: cp.progress }
        })
      }

      // Check if progress is 100% but not marked completed
      if (cp.progress >= 1 && !cp.isCompleted) {
        issues.push({
          type: 'course',
          id: cp.id,
          issue: 'Progress 100% but not marked completed',
          currentValue: { isCompleted: cp.isCompleted, progress: cp.progress },
          suggestedValue: { isCompleted: true, progress: cp.progress }
        })
      }

      // Check time spent validity
      if (cp.timeSpent < 0) {
        issues.push({
          type: 'course',
          id: cp.id,
          issue: 'Negative time spent',
          currentValue: cp.timeSpent,
          suggestedValue: 0
        })
      }
    }

    // 2. Check ChapterProgress inconsistencies
    console.log('📖 Checking chapter progress issues...')
    const chapterProgressIssues = await prisma.chapterProgress.findMany({
      include: {
        chapter: true
      }
    })

    for (const chp of chapterProgressIssues) {
      // Check progress bounds
      if (chp.progress < 0 || chp.progress > 1) {
        issues.push({
          type: 'chapter',
          id: chp.id,
          issue: 'Chapter progress out of bounds',
          currentValue: chp.progress,
          suggestedValue: Math.max(0, Math.min(1, chp.progress))
        })
      }

      // Check completion consistency
      if (chp.isCompleted && chp.progress < 0.95) {
        issues.push({
          type: 'chapter',
          id: chp.id,
          issue: 'Chapter marked completed but progress < 95%',
          currentValue: { isCompleted: chp.isCompleted, progress: chp.progress },
          suggestedValue: { isCompleted: false, progress: chp.progress }
        })
      }

      // Check time spent
      if (chp.timeSpent < 0) {
        issues.push({
          type: 'chapter',
          id: chp.id,
          issue: 'Negative chapter time spent',
          currentValue: chp.timeSpent,
          suggestedValue: 0
        })
      }
    }

    // 3. Check Quiz completion inconsistencies
    console.log('🧠 Checking quiz completion issues...')
    const quizAttempts = await prisma.userQuizAttempt.findMany({
      include: {
        userQuiz: {
          include: {
            _count: {
              select: {
                questions: true
              }
            }
          }
        }
      }
    })

    for (const qa of quizAttempts) {
      // Check score bounds
      if (qa.score < 0 || qa.score > 100) {
        issues.push({
          type: 'quiz',
          id: qa.id,
          issue: 'Quiz score out of bounds (0-100)',
          currentValue: qa.score,
          suggestedValue: Math.max(0, Math.min(100, qa.score || 0))
        })
      }

      // Check time spent validity
      if (qa.timeSpent && qa.timeSpent < 0) {
        issues.push({
          type: 'quiz',
          id: qa.id,
          issue: 'Negative quiz time spent',
          currentValue: qa.timeSpent,
          suggestedValue: 0
        })
      }

      // Check accuracy consistency with score
      if (qa.accuracy !== null && qa.score !== null) {
        const expectedAccuracy = qa.score / 100
        if (Math.abs(qa.accuracy - expectedAccuracy) > 0.1) {
          issues.push({
            type: 'quiz',
            id: qa.id,
            issue: 'Accuracy doesn\'t match score',
            currentValue: { accuracy: qa.accuracy, score: qa.score },
            suggestedValue: { accuracy: expectedAccuracy, score: qa.score }
          })
        }
      }
    }

    console.log(`✅ Analysis complete. Found ${issues.length} issues.`)
    return issues

  } catch (error) {
    console.error('❌ Error analyzing progress issues:', error)
    throw error
  }
}

async function fixProgressIssues(issues: ProgressIssue[], dryRun: boolean = true): Promise<void> {
  console.log(`🔧 ${dryRun ? 'DRY RUN - ' : ''}Fixing ${issues.length} progress issues...`)

  if (dryRun) {
    console.log('📋 Issues that would be fixed:')
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type.toUpperCase()} ${issue.id}: ${issue.issue}`)
      console.log(`   Current: ${JSON.stringify(issue.currentValue)}`)
      console.log(`   Suggested: ${JSON.stringify(issue.suggestedValue)}`)
      console.log('')
    })
    return
  }

  let fixed = 0
  
  for (const issue of issues) {
    try {
      switch (issue.type) {
        case 'course':
          if (typeof issue.suggestedValue === 'object' && 'isCompleted' in issue.suggestedValue) {
            await prisma.courseProgress.update({
              where: { id: issue.id as number },
              data: {
                isCompleted: issue.suggestedValue.isCompleted,
                progress: issue.suggestedValue.progress
              }
            })
          } else {
            await prisma.courseProgress.update({
              where: { id: issue.id as number },
              data: { 
                progress: typeof issue.suggestedValue === 'number' ? issue.suggestedValue : undefined,
                timeSpent: issue.issue.includes('time') ? issue.suggestedValue : undefined
              }
            })
          }
          break

        case 'chapter':
          if (typeof issue.suggestedValue === 'object' && 'isCompleted' in issue.suggestedValue) {
            await prisma.chapterProgress.update({
              where: { id: issue.id as number },
              data: {
                isCompleted: issue.suggestedValue.isCompleted,
                progress: issue.suggestedValue.progress
              }
            })
          } else {
            await prisma.chapterProgress.update({
              where: { id: issue.id as number },
              data: { 
                progress: typeof issue.suggestedValue === 'number' ? issue.suggestedValue : undefined,
                timeSpent: issue.issue.includes('time') ? issue.suggestedValue : undefined
              }
            })
          }
          break

        case 'quiz':
          if (typeof issue.suggestedValue === 'object' && 'accuracy' in issue.suggestedValue) {
            await prisma.userQuizAttempt.update({
              where: { id: issue.id as number },
              data: {
                accuracy: issue.suggestedValue.accuracy,
                score: issue.suggestedValue.score
              }
            })
          } else {
            await prisma.userQuizAttempt.update({
              where: { id: issue.id as number },
              data: { 
                score: issue.issue.includes('score') ? issue.suggestedValue : undefined,
                timeSpent: issue.issue.includes('time') ? issue.suggestedValue : undefined
              }
            })
          }
          break
      }
      fixed++
    } catch (error) {
      console.error(`❌ Failed to fix ${issue.type} ${issue.id}:`, error)
    }
  }

  console.log(`✅ Successfully fixed ${fixed}/${issues.length} issues.`)
}

async function recalculateAllProgress(): Promise<void> {
  console.log('🔄 Recalculating all progress data...')

  try {
    // Recalculate course progress based on chapter completion
    const courseProgresses = await prisma.courseProgress.findMany({
      include: {
        course: {
          include: {
            courseUnits: {
              include: {
                chapters: true
              }
            }
          }
        }
      }
    })

    for (const cp of courseProgresses) {
      const totalChapters = cp.course.courseUnits.reduce((sum, unit) => sum + unit.chapters.length, 0)
      
      if (totalChapters > 0) {
        // Get completed chapters for this user/course
        const completedChapters = await prisma.chapterProgress.count({
          where: {
            userId: cp.userId,
            chapter: {
              courseUnit: {
                courseId: cp.courseId
              }
            },
            isCompleted: true
          }
        })

        const calculatedProgress = completedChapters / totalChapters
        const isCompleted = calculatedProgress >= 1

        // Update if different
        if (Math.abs(cp.progress - calculatedProgress) > 0.01 || cp.isCompleted !== isCompleted) {
          await prisma.courseProgress.update({
            where: { id: cp.id },
            data: {
              progress: calculatedProgress,
              isCompleted: isCompleted,
              updatedAt: new Date()
            }
          })
          console.log(`Updated course ${cp.courseId} progress: ${cp.progress} → ${calculatedProgress}`)
        }
      }
    }

    console.log('✅ Progress recalculation complete.')
  } catch (error) {
    console.error('❌ Error recalculating progress:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting Dashboard Progress Cleanup...')
  
  try {
    // Step 1: Analyze issues
    const issues = await analyzeProgressIssues()
    
    if (issues.length === 0) {
      console.log('🎉 No issues found! Dashboard progress data looks good.')
      return
    }

    // Step 2: Show issues (dry run)
    await fixProgressIssues(issues, true)

    // Step 3: Ask for confirmation
    console.log('Do you want to proceed with fixing these issues? (y/N)')
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise<string>((resolve) => {
      readline.question('', resolve)
    })
    readline.close()

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      // Step 4: Fix issues
      await fixProgressIssues(issues, false)
      
      // Step 5: Recalculate all progress
      await recalculateAllProgress()
      
      console.log('🎉 Dashboard progress cleanup completed successfully!')
    } else {
      console.log('❌ Cleanup cancelled by user.')
    }

  } catch (error) {
    console.error('💥 Fatal error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { analyzeProgressIssues, fixProgressIssues, recalculateAllProgress }