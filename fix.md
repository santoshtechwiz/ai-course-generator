# Course Creation Bug Fixes & Improvements 🛠️

## Critical Issues to Fix

### 1. Schema Validation Issues ⚠️

**Problem**: Duplicate and inconsistent course creation schemas
- `createCourseSchema` vs `createChaptersSchema` 
- Different validation rules (description: 500 vs 1000 chars)
- Type mismatches between frontend and backend

**Fix**:
```typescript
// schema/schema.ts - Consolidate into single schema
export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.string().min(1, "Category is required"),
  units: z.array(z.string().min(1, "Unit title is required")).min(1, "At least one unit is required").max(10, "Maximum 10 units allowed"),
})

// Remove createChaptersSchema and use createCourseSchema everywhere
export const createChaptersSchema = createCourseSchema // For backward compatibility
```

### 2. Form Validation Logic Bug 🔧

**Problem**: Step 3 validation always returns true, allowing invalid submissions

**Fix**:
```typescript
// app/dashboard/create/components/CreateCourseForm.tsx
const isStepValid = () => {
  const formData = watch()
  
  if (step === 1) {
    return !!(formData.title?.trim() && formData.description?.trim() && formData.category)
  } 
  if (step === 2) {
    return formData.units?.length > 0 && formData.units.every((unit) => unit?.trim().length > 0)
  }
  if (step === 3) {
    // Validate all previous steps before allowing final submission
    return !!(formData.title?.trim() && 
             formData.description?.trim() && 
             formData.category &&
             formData.units?.length > 0 && 
             formData.units.every((unit) => unit?.trim().length > 0))
  }
  return false
}
```

### 3. Error Handling Improvements 📋

**Problem**: Generic error messages, no specific validation feedback

**Fix**:
```typescript
// app/dashboard/create/components/CreateCourseForm.tsx
const createCourseMutation = useMutation({
  mutationFn: async (data: CreateCourseInput) => {
    const response = await api.post("/course", data)
    return response.data
  },
  onSuccess: async (data) => {
    if (!data?.slug) {
      throw new Error("Invalid response: missing course slug")
    }
    toast({
      title: "Success",
      description: "Course created successfully",
    })
    try { await dispatch(forceSyncSubscription()).unwrap() } catch {/* ignore */}
    refreshSubscription()
    router.push(`/dashboard/create/${data.slug}`)
  },
  onError: (error: any) => {
    let errorMessage = "Something went wrong"
    
    if (error?.response?.status === 402) {
      errorMessage = "Insufficient credits to create course"
    } else if (error?.response?.status === 400) {
      errorMessage = error?.response?.data?.error || "Invalid course data"
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
  },
})
```

### 4. API Error Response Standardization 🔄

**Problem**: Inconsistent error responses from API

**Fix**:
```typescript
// app/api/course/route.ts
export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log in to create a course" 
      }, { status: 401 })
    }

    const data = await req.json()
    
    // Enhanced validation with specific error messages
    try {
      var parsedData = createChaptersSchema.parse(data)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          error: "Validation failed",
          message: "Please check your input data",
          details: validationError.errors
        }, { status: 400 })
      }
    }

    const result = await courseService.createCourse(session.user.id, parsedData)
    
    if (!result.slug) {
      throw new Error("Course creation failed: no slug generated")
    }
    
    return NextResponse.json({ 
      success: true,
      slug: result.slug,
      message: "Course created successfully" 
    })
    
  } catch (error: any) {
    console.error(`Course creation error:`, error)

    if (error.message === "Insufficient credits") {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        message: "You need at least 1 credit to create a course" 
      }, { status: 402 })
    }

    return NextResponse.json({
      error: "Course creation failed",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }, { status: 500 })
  }
}
```

### 5. Form State Persistence 💾

**Problem**: Form data lost on page refresh or navigation

**Fix**:
```typescript
// app/dashboard/create/components/CreateCourseForm.tsx
// Add form persistence
useEffect(() => {
  // Load saved form data
  const savedData = localStorage.getItem('course-creation-form')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      Object.keys(parsed).forEach(key => {
        setValue(key as keyof CreateCourseInput, parsed[key])
      })
    } catch {/* ignore */}
  }
}, [setValue])

// Save form data on changes
useEffect(() => {
  const subscription = watch((data) => {
    localStorage.setItem('course-creation-form', JSON.stringify(data))
  })
  return () => subscription.unsubscribe()
}, [watch])

// Clear saved data on successful submission
const onSuccess = async (data) => {
  localStorage.removeItem('course-creation-form')
  // ... rest of success logic
}
```

### 6. Credit System Race Condition Fix 🏁

**Problem**: Credits decremented after course creation, no rollback

**Fix**:
```typescript
// app/services/course.service.ts
async createCourse(userId: string, courseData: z.infer<typeof createChaptersSchema>): Promise<CourseCreationResult> {
  // Start transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Check and reserve credits first
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })
    
    if (!user || user.credits < 1) {
      throw new Error("Insufficient credits")
    }
    
    // 2. Decrement credits immediately
    await tx.user.update({
      where: { id: userId },
      data: { credits: user.credits - 1 }
    })
    
    try {
      // 3. Create course (all the existing logic)
      const { title, units, category, description } = courseData
      const slug = await this.generateUniqueSlug(title, tx)
      const outputUnits = await generateCourseContent(title, units)
      const courseImage = await getUnsplashImage(title)
      const categoryId = await this.getOrCreateCategory(category, tx)
      
      const course = await this.createCourseWithUnits({
        title, description, image: courseImage, userId, categoryId, slug,
      }, outputUnits, tx)
      
      return { slug: course.slug! }
      
    } catch (error) {
      // Transaction will automatically rollback credits on error
      throw error
    }
  })
}
```

### 7. Input Sanitization & Security 🔒

**Problem**: No HTML sanitization, potential XSS vulnerabilities

**Fix**:
```typescript
// utils/sanitization.ts
import DOMPurify from 'isomorphic-dompurify'

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim(), { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  })
}

// app/dashboard/create/components/BasicInfoStep.tsx
const sanitizedTitle = sanitizeInput(field.value || '')
const sanitizedDescription = sanitizeInput(field.value || '')
```

### 8. Navigation Protection 🛡️

**Problem**: Users can access creation page without credits

**Fix**:
```typescript
// app/dashboard/create/page.tsx
export default async function CreateCoursePage() {
  const session = await getAuthSession()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true }
  })
  
  if (!user || user.credits < 1) {
    redirect('/dashboard/subscription')
  }
  
  // ... rest of page logic
}
```

### 9. Form Component Improvements 🎯

**Problem**: Poor UX feedback and validation display

**Fix**:
```typescript
// app/dashboard/create/components/BasicInfoStep.tsx
<div className="space-y-2">
  <Label className="text-base font-medium">
    Title <span className="text-red-500">*</span>
  </Label>
  <Controller
    name="title"
    control={control}
    render={({ field }) => (
      <div className="relative">
        <Input
          {...field}
          placeholder="Enter course title (3-100 characters)"
          className={cn(
            "transition-all duration-200",
            errors.title ? "border-red-500 focus:border-red-500" : ""
          )}
          maxLength={100}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {field.value?.length || 0}/100
        </div>
      </div>
    )}
  />
  {errors.title && (
    <div className="flex items-center gap-2 text-sm text-red-600">
      <AlertCircle className="h-4 w-4" />
      {errors.title.message}
    </div>
  )}
</div>
```

### 10. Performance Optimizations ⚡

**Problem**: Excessive re-renders and API calls

**Fix**:
```typescript
// app/dashboard/create/components/CreateCourseForm.tsx
// Debounce form validation
const debouncedValidation = useMemo(
  () => debounce((step: number) => {
    // Validation logic
  }, 300),
  []
)

// Memoize step validity
const stepValidity = useMemo(() => isStepValid(), [watch(), step])

// Optimize watch usage
const formValues = watch()
const { title, description, category, units } = formValues
```

## Implementation Priority

1. **Critical (Fix immediately)**:
   - Schema consolidation (#1)
   - Step validation bug (#2)
   - Credit system transaction (#6)

2. **High (Fix within sprint)**:
   - Error handling (#3, #4)
   - Input sanitization (#7)
   - Navigation protection (#8)

3. **Medium (Next sprint)**:
   - Form persistence (#5)
   - UX improvements (#9)
   - Performance optimizations (#10)

## Testing Checklist

- [ ] Test course creation with insufficient credits
- [ ] Test form validation at each step
- [ ] Test error scenarios (network failures, invalid data)
- [ ] Test form persistence across page refreshes
- [ ] Test XSS protection with malicious input
- [ ] Test concurrent course creation attempts
- [ ] Verify credit rollback on failed creation
- [ ] Test navigation protection

## Files to Modify

1. `schema/schema.ts` - Schema consolidation
2. `app/dashboard/create/components/CreateCourseForm.tsx` - Main form logic
3. `app/dashboard/create/components/BasicInfoStep.tsx` - Input validation
4. `app/api/course/route.ts` - API error handling
5. `app/services/course.service.ts` - Transaction handling
6. `app/dashboard/create/page.tsx` - Access protection
7. `utils/sanitization.ts` - New utility file

This comprehensive fix addresses the major bugs and security issues in the course creation system while improving user experience and system reliability.