import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// Read the exported data
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataPath = path.join(__dirname, 'all-data.json')
const rawData = fs.readFileSync(dataPath, 'utf-8')
const data = JSON.parse(rawData)

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Disable foreign key checks for seeding
    await prisma.$executeRaw`SET session_replication_role = replica;`
    
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await clearExistingData()

    // Seed categories first
    console.log('📂 Seeding categories...')
    await seedCategories()

    // Seed users and related data
    console.log('👥 Seeding users...')
    const userIdMap = await seedUsers()

    // Seed courses
    console.log('📚 Seeding courses...')
    const courseIdMap = await seedCourses(userIdMap)

    // Seed course units and chapters
    console.log('📖 Seeding course units...')
    await seedCourseUnits(courseIdMap)

    // Seed flashcards
    console.log('🗂️ Seeding flashcards...')
    await seedFlashCards(userIdMap)

    // Seed user quizzes
    console.log('❓ Seeding user quizzes...')
    await seedUserQuizzes(userIdMap)

    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`

    console.log('✅ Database seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function clearExistingData() {
  const deleteOrder = [
    'userNotification',
    'userAchievement', 
    'courseRating',
    'courseProgress',
    'flashCardReview',
    'flashCard',
    'courseQuizAttempt',
    'courseQuiz',
    'userQuizQuestion',
    'userQuiz',
    'chapter',
    'courseUnit',
    'course',
    'category',
    'userSubscription',
    'userReferralUse',
    'userReferral',
    'session',
    'account',
    'user'
  ]

  for (const tableName of deleteOrder) {
    try {
      await (prisma as any)[tableName].deleteMany()
    } catch (error) {
      console.warn(`Warning: Could not clear table ${tableName}:`, error)
    }
  }
}

async function seedCategories() {
  const categories = data.categories || [
    { name: 'Programming' },
    { name: 'Data Science' },
    { name: 'Web Development' },
    { name: 'Mobile Development' },
    { name: 'DevOps' },
    { name: 'AI & Machine Learning' },
    { name: 'Cybersecurity' },
    { name: 'Cloud Computing' },
    { name: 'Database' },
    { name: 'Design' }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: { name: category.name }
    })
  }
}

async function seedUsers() {
  const users = data.users || []
  const userIdMap = new Map<string, string>()

  console.log(`Processing ${users.length} users...`)

  for (const userData of users) {
    if (!userData.email) {
      console.warn(`Skipping user with missing email: ${userData.id}`)
      continue
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      let user
      if (existingUser) {
        user = existingUser
      } else {
        user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            image: userData.image,
            isAdmin: userData.isAdmin || false,
            userType: userData.userType || "FREE",
            isActive: userData.isActive !== false,
            emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
            language: userData.language || null,
            createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
            updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
            credits: userData.credits || 0,
            creditsUsed: userData.creditsUsed || 0
          }
        })
      }

      userIdMap.set(userData.id, user.id)

      // Create accounts for this user
      if (userData.accounts && userData.accounts.length > 0) {
        for (const accountData of userData.accounts) {
          try {
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: accountData.provider,
                  providerAccountId: accountData.providerAccountId
                }
              }
            })

            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: user.id,
                  type: accountData.type,
                  provider: accountData.provider,
                  providerAccountId: accountData.providerAccountId,
                  refresh_token: accountData.refresh_token,
                  access_token: accountData.access_token,
                  expires_at: accountData.expires_at,
                  token_type: accountData.token_type,
                  scope: accountData.scope,
                  id_token: accountData.id_token,
                  session_state: accountData.session_state
                }
              })
            }
          } catch (accountError) {
            console.warn(`Failed to create account for user ${userData.email}:`, accountError)
          }
        }
      }

    } catch (error) {
      console.warn(`Failed to create user ${userData.email}:`, error)
    }
  }

  console.log(`Created/found ${userIdMap.size} users`)
  return userIdMap
}

async function seedCourses(userIdMap: Map<string, string>) {
  const courses = data.courses || []
  const courseIdMap = new Map<number, number>()
  console.log(`Processing ${courses.length} courses...`)

  let created = 0
  for (const courseData of courses) {
    const newUserId = userIdMap.get(courseData.userId)
    if (!newUserId) {
      console.warn(`Skipping course for non-existent user: ${courseData.userId}`)
      continue
    }

    try {
      let categoryId = null
      if (courseData.categoryId && data.categories) {
        const categoryFromData = data.categories.find((cat: any) => cat.id === courseData.categoryId)
        if (categoryFromData) {
          const existingCategory = await prisma.category.findFirst({
            where: { name: categoryFromData.name }
          })
          categoryId = existingCategory?.id || null
        }
      }

      const course = await prisma.course.create({
        data: {
          title: courseData.title,
          description: courseData.description,
          image: courseData.image || '/default-course.png',
          userId: newUserId,
          categoryId: categoryId,
          isCompleted: courseData.isCompleted || false,
          isPublic: courseData.isPublic || false,
          isFeatured: courseData.isFeatured || false,
          slug: courseData.slug || `${courseData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          difficulty: courseData.difficulty,
          estimatedHours: courseData.estimatedHours,
          language: courseData.language,
          status: courseData.status || "PUBLISHED",
          createdAt: courseData.createdAt ? new Date(courseData.createdAt) : new Date(),
          updatedAt: courseData.updatedAt ? new Date(courseData.updatedAt) : new Date()
        }
      })
      
      courseIdMap.set(courseData.id, course.id)
      created++
    } catch (error) {
      console.warn(`Failed to create course ${courseData.title}:`, error)
    }
  }

  console.log(`Created ${created} courses`)
  return courseIdMap
}

async function seedCourseUnits(courseIdMap: Map<number, number>) {
  // First, seed courseUnits that are nested within courses
  const courses = data.courses || []
  let createdUnits = 0
  let createdChapters = 0

  for (const courseData of courses) {
    const newCourseId = courseIdMap.get(courseData.id)
    if (!newCourseId) {
      console.warn(`Skipping courseUnits for non-existent course: ${courseData.id}`)
      continue
    }

    if (courseData.courseUnits && courseData.courseUnits.length > 0) {
      for (const unitData of courseData.courseUnits) {
        try {
          const unit = await prisma.courseUnit.create({
            data: {
              courseId: newCourseId,
              name: unitData.name,
              isCompleted: unitData.isCompleted || false,
              duration: unitData.duration,
              order: unitData.order,
              createdAt: unitData.createdAt ? new Date(unitData.createdAt) : new Date(),
              updatedAt: unitData.updatedAt ? new Date(unitData.updatedAt) : new Date()
            }
          })

          createdUnits++

          // Create chapters for this unit
          if (unitData.chapters && unitData.chapters.length > 0) {
            for (const chapterData of unitData.chapters) {
              try {
                await prisma.chapter.create({
                  data: {
                    unitId: unit.id,
                    title: chapterData.title,
                    youtubeSearchQuery: chapterData.youtubeSearchQuery,
                    videoId: chapterData.videoId,
                    summary: chapterData.summary,
                    isCompleted: chapterData.isCompleted || false,
                    summaryStatus: chapterData.summaryStatus || 'pending',
                    videoStatus: chapterData.videoStatus || 'pending',
                    order: chapterData.order || 0,
                    createdAt: chapterData.createdAt ? new Date(chapterData.createdAt) : new Date(),
                    updatedAt: chapterData.updatedAt ? new Date(chapterData.updatedAt) : new Date()
                  }
                })
                createdChapters++
              } catch (chapterError) {
                console.warn(`Failed to create chapter ${chapterData.title}:`, chapterError)
              }
            }
          }
        } catch (unitError) {
          console.warn(`Failed to create unit ${unitData.name}:`, unitError)
        }
      }
    }
  }

  // Then, seed standalone courseUnits
  const standaloneUnits = data.courseUnits || []
  for (const unitData of standaloneUnits) {
    const newCourseId = courseIdMap.get(unitData.courseId)
    if (!newCourseId) {
      console.warn(`Skipping standalone unit for non-existent course: ${unitData.courseId}`)
      continue
    }

    try {
      const unit = await prisma.courseUnit.create({
        data: {
          courseId: newCourseId,
          name: unitData.name,
          isCompleted: unitData.isCompleted || false,
          duration: unitData.duration,
          order: unitData.order,
          createdAt: unitData.createdAt ? new Date(unitData.createdAt) : new Date(),
          updatedAt: unitData.updatedAt ? new Date(unitData.updatedAt) : new Date()
        }
      })

      createdUnits++

      // Create chapters for this unit
      if (unitData.chapters && unitData.chapters.length > 0) {
        for (const chapterData of unitData.chapters) {
          try {
            await prisma.chapter.create({
              data: {
                unitId: unit.id,
                title: chapterData.title,
                youtubeSearchQuery: chapterData.youtubeSearchQuery,
                videoId: chapterData.videoId,
                summary: chapterData.summary,
                isCompleted: chapterData.isCompleted || false,
                summaryStatus: chapterData.summaryStatus || 'pending',
                videoStatus: chapterData.videoStatus || 'pending',
                order: chapterData.order || 0,
                createdAt: chapterData.createdAt ? new Date(chapterData.createdAt) : new Date(),
                updatedAt: chapterData.updatedAt ? new Date(chapterData.updatedAt) : new Date()
              }
            })
            createdChapters++
          } catch (chapterError) {
            console.warn(`Failed to create chapter ${chapterData.title}:`, chapterError)
          }
        }
      }
    } catch (unitError) {
      console.warn(`Failed to create standalone unit ${unitData.name}:`, unitError)
    }
  }

  console.log(`Created ${createdUnits} course units and ${createdChapters} chapters`)
}

async function seedFlashCards(userIdMap: Map<string, string>) {
  // First, seed flashCards that are nested within users
  const users = data.users || []
  let createdFlashCards = 0

  for (const userData of users) {
    const newUserId = userIdMap.get(userData.id)
    if (!newUserId) {
      continue
    }

    if (userData.flashCards && userData.flashCards.length > 0) {
      for (const flashCardData of userData.flashCards) {
        try {
          await prisma.flashCard.create({
            data: {
              question: flashCardData.question,
              answer: flashCardData.answer,
              userId: newUserId,
              slug: flashCardData.slug,
              userQuizId: flashCardData.userQuizId,
              difficulty: flashCardData.difficulty || 'medium',
              saved: flashCardData.saved || false,
              createdAt: flashCardData.createdAt ? new Date(flashCardData.createdAt) : new Date(),
              updatedAt: flashCardData.updatedAt ? new Date(flashCardData.updatedAt) : new Date()
            }
          })
          createdFlashCards++
        } catch (flashCardError) {
          console.warn(`Failed to create flashcard for user ${userData.email}:`, flashCardError)
        }
      }
    }
  }

  // Then, seed standalone flashCards
  const standaloneFlashCards = data.flashCards || []
  for (const flashCardData of standaloneFlashCards) {
    const newUserId = userIdMap.get(flashCardData.userId)
    if (!newUserId) {
      console.warn(`Skipping flashcard for non-existent user: ${flashCardData.userId}`)
      continue
    }

    try {
      await prisma.flashCard.create({
        data: {
          question: flashCardData.question,
          answer: flashCardData.answer,
          userId: newUserId,
          slug: flashCardData.slug,
          userQuizId: flashCardData.userQuizId,
          difficulty: flashCardData.difficulty || 'medium',
          saved: flashCardData.saved || false,
          createdAt: flashCardData.createdAt ? new Date(flashCardData.createdAt) : new Date(),
          updatedAt: flashCardData.updatedAt ? new Date(flashCardData.updatedAt) : new Date()
        }
      })
      createdFlashCards++
    } catch (flashCardError) {
      console.warn(`Failed to create standalone flashcard:`, flashCardError)
    }
  }

  console.log(`Created ${createdFlashCards} flashcards`)
}

async function seedUserQuizzes(userIdMap: Map<string, string>) {
  const userQuizzes = data.userQuizzes || []
  console.log(`Processing ${userQuizzes.length} user quizzes...`)

  let created = 0
  let createdQuestions = 0
  let createdOpenEnded = 0

  for (const quizData of userQuizzes) {
    const correctUserId = userIdMap.get(quizData.userId)
    if (!correctUserId) {
      console.warn(`Skipping quiz for non-existent user: ${quizData.userId}`)
      continue
    }

    try {
      const quiz = await prisma.userQuiz.create({
        data: {
          userId: correctUserId,
          title: quizData.title,
          description: quizData.description,
          quizType: quizData.quizType || "MCQ",
          isPublic: quizData.isPublic || false,
          difficulty: quizData.difficulty,
          passingScore: quizData.passingScore || 70,
          slug: quizData.slug || `${quizData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          timeStarted: quizData.timeStarted ? new Date(quizData.timeStarted) : new Date(),
          timeEnded: quizData.timeEnded ? new Date(quizData.timeEnded) : null,
          lastAttempted: quizData.lastAttempted ? new Date(quizData.lastAttempted) : null,
          bestScore: quizData.bestScore,
          isFavorite: quizData.isFavorite || false,
          points: quizData.points || 0,
          language: quizData.language,
          createdAt: quizData.createdAt ? new Date(quizData.createdAt) : new Date(),
          updatedAt: quizData.updatedAt ? new Date(quizData.updatedAt) : new Date()
        }
      })

      // Create questions for this quiz
      if (quizData.questions && quizData.questions.length > 0) {
        for (const questionData of quizData.questions) {
          try {
            const question = await prisma.userQuizQuestion.create({
              data: {
                userQuizId: quiz.id,
                question: questionData.question,
                answer: questionData.answer,
                options: questionData.options,
                questionType: questionData.questionType || 'mcq',
                codeSnippet: questionData.codeSnippet,
                createdAt: questionData.createdAt ? new Date(questionData.createdAt) : new Date(),
                updatedAt: questionData.updatedAt ? new Date(questionData.updatedAt) : new Date()
              }
            })

            createdQuestions++

            // Create open-ended question if it exists
            if (questionData.openEndedQuestion) {
              try {
                await prisma.openEndedQuestion.create({
                  data: {
                    questionId: question.id,
                    userQuizId: quiz.id,
                    hints: questionData.openEndedQuestion.hints,
                    difficulty: questionData.openEndedQuestion.difficulty,
                    tags: questionData.openEndedQuestion.tags,
                    sampleAnswer: questionData.openEndedQuestion.sampleAnswer,
                    evaluationCriteria: questionData.openEndedQuestion.evaluationCriteria,
                    maxScore: questionData.openEndedQuestion.maxScore,
                    createdAt: questionData.openEndedQuestion.createdAt ? new Date(questionData.openEndedQuestion.createdAt) : new Date(),
                    updatedAt: questionData.openEndedQuestion.updatedAt ? new Date(questionData.openEndedQuestion.updatedAt) : new Date()
                  }
                })
                createdOpenEnded++
              } catch (openEndedError) {
                console.warn(`Failed to create open-ended question for quiz ${quizData.title}:`, openEndedError)
              }
            }
          } catch (questionError) {
            console.warn(`Failed to create question for quiz ${quizData.title}:`, questionError)
          }
        }
      }

      created++
    } catch (error) {
      console.warn(`Failed to create quiz ${quizData.title}:`, error)
    }
  }

  console.log(`Created ${created} quizzes, ${createdQuestions} questions, and ${createdOpenEnded} open-ended questions`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
