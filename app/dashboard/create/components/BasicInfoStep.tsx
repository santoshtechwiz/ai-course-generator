"use client"

import { type Control, Controller, type FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CreateCourseInput } from "@/schema/schema"
import type { QueryParams } from "@/app/types/types"
import { BookOpen, FileText, Tag, AlertCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface BasicInfoStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
  params?: QueryParams
}

export function BasicInfoStep({ control, errors, params }: BasicInfoStepProps) {
  return (
    <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto">
      {/* Engaging intro card */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 border-4 border-black rounded-xl p-4 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-3">
          <div className="p-2 md:p-3 bg-white border-3 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-black" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-black mb-1 md:mb-2">Let's Create Something Amazing!</h3>
            <p className="text-xs md:text-sm text-black/80 font-bold leading-relaxed">
              Tell us about your course. Be specific and descriptive to help learners find and understand your content.
            </p>
          </div>
        </div>
      </div>

      {/* Course Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 md:p-2 bg-blue-400 border-3 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-black" />
          </div>
          <Label htmlFor="title" className="text-sm md:text-base font-black text-black">
            Course Title <span className="text-red-500">*</span>
          </Label>
        </div>
        
        <Controller
          name="title"
          control={control}
          defaultValue={params?.title || ""}
          render={({ field }) => (
            <div className="relative">
              <Input 
                {...field} 
                id="title" 
                placeholder="e.g., Master Web Development in 30 Days" 
                className={cn(
                  "border-3 md:border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-200 font-bold text-sm md:text-base h-11 md:h-12 px-4",
                  errors.title 
                    ? "bg-red-100 border-red-500" 
                    : "bg-white hover:bg-blue-50"
                )}
              />
              {field.value && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )}
        />
        
        {errors.title && (
          <div className="flex items-center gap-2 bg-red-100 border-3 border-red-500 rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs md:text-sm text-red-700 font-bold">{errors.title.message}</p>
          </div>
        )}
        
        <p className="text-xs md:text-sm text-gray-600 font-bold flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
          Make it catchy and descriptive to attract learners
        </p>
      </div>

      {/* Course Description */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 md:p-2 bg-purple-400 border-3 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-black" />
          </div>
          <Label htmlFor="description" className="text-sm md:text-base font-black text-black">
            Course Description <span className="text-red-500">*</span>
          </Label>
        </div>
        
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Textarea
                {...field}
                id="description"
                placeholder="Describe what students will learn, who it's for, and what makes your course unique..."
                className={cn(
                  "min-h-[120px] md:min-h-[140px] border-3 md:border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-200 font-bold text-sm md:text-base p-4 resize-none",
                  errors.description 
                    ? "bg-red-100 border-red-500" 
                    : "bg-white hover:bg-purple-50"
                )}
              />
              <div className="absolute bottom-3 right-3 text-xs font-bold text-gray-500 bg-white/80 px-2 py-1 rounded border-2 border-black">
                {field.value?.length || 0} chars
              </div>
            </div>
          )}
        />
        
        {errors.description && (
          <div className="flex items-center gap-2 bg-red-100 border-3 border-red-500 rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs md:text-sm text-red-700 font-bold">{errors.description.message}</p>
          </div>
        )}
        
        <div className="bg-blue-50 border-3 border-blue-400 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm font-bold text-blue-900 mb-2">💡 Pro Tips:</p>
          <ul className="space-y-1 text-xs md:text-sm text-blue-800 font-medium">
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Explain what problems your course solves</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Mention key learning outcomes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>Specify the target audience level</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 md:p-2 bg-green-400 border-3 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Tag className="h-4 w-4 md:h-5 md:w-5 text-black" />
          </div>
          <Label htmlFor="category" className="text-sm md:text-base font-black text-black">
            Category <span className="text-red-500">*</span>
          </Label>
        </div>
        
        <Controller
          name="category"
          control={control}
          defaultValue={params?.category || ""}
          render={({ field }) => (
            <div className="relative">
              <Input 
                {...field} 
                id="category" 
                placeholder="e.g., Programming, Design, Marketing, Business" 
                className={cn(
                  "border-3 md:border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-200 font-bold text-sm md:text-base h-11 md:h-12 px-4",
                  errors.category 
                    ? "bg-red-100 border-red-500" 
                    : "bg-white hover:bg-green-50"
                )}
              />
              {field.value && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )}
        />
        
        {errors.category && (
          <div className="flex items-center gap-2 bg-red-100 border-3 border-red-500 rounded-lg p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs md:text-sm text-red-700 font-bold">{errors.category.message}</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold text-gray-600">Popular categories:</span>
          {["Programming", "Design", "Business", "Marketing", "Data Science"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => control._formValues.category !== cat && control._setValue('category', cat)}
              className="px-3 py-1 text-xs font-bold bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}