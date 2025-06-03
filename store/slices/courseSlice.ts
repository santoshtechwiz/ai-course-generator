import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { FullCourseType, CourseProgress } from "@/app/types/types";

// Define the state interface
interface CourseState {
  currentCourse: FullCourseType | null;
  courseProgress: CourseProgress | null;
  currentChapterId: number | string | null;
  currentVideoId: string | null;
  isLoading: boolean;
  error: string | null;
  completedChapters: (string | number)[];
  bookmarks: Record<string, number[]>;
  courseCompletionStatus: boolean;
}

// Initial state
const initialState: CourseState = {
  currentCourse: null,
  courseProgress: null,
  currentChapterId: null,
  currentVideoId: null,
  isLoading: false,
  error: null,
  completedChapters: [],
  bookmarks: {},
  courseCompletionStatus: false,
};

// Async thunk for fetching course data
export const fetchCourseDataApi = createAsyncThunk(
  "course/fetchCourseData",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/courses/${slug}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course data"
      );
    }
  }
);

// Async thunk for updating course progress
export const updateCourseProgressApi = createAsyncThunk(
  "course/updateCourseProgress",
  async (
    data: {
      courseId: number | string;
      chapterId?: number | string;
      completedChapters?: (number | string)[];
      progress?: number;
      isCompleted?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/api/courses/${data.courseId}/progress`,
        data
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course progress"
      );
    }
  }
);

// Course slice
const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCurrentChapterApi: (state, action: PayloadAction<number | string>) => {
      state.currentChapterId = action.payload;
    },
    setCurrentVideoApi: (state, action: PayloadAction<string>) => {
      state.currentVideoId = action.payload;
    },
    // Mark a chapter as completed
    markChapterAsCompleted: (state, action: PayloadAction<number | string>) => {
      const chapterId = action.payload;
      if (!state.completedChapters.includes(chapterId)) {
        state.completedChapters.push(chapterId);

        // Update the progress object if it exists
        if (state.courseProgress) {
          if (!state.courseProgress.completedChapters.includes(chapterId)) {
            state.courseProgress.completedChapters.push(chapterId);

            // Recalculate overall progress percentage if we have a current course
            if (state.currentCourse?.courseUnits) {
              const totalChapters = state.currentCourse.courseUnits.reduce(
                (acc, unit) => acc + unit.chapters.length,
                0
              );

              if (totalChapters > 0) {
                state.courseProgress.progress =
                  (state.courseProgress.completedChapters.length / totalChapters) *
                  100;
              }
            }
          }
        }
      }
    },
    // Set bookmarks for a specific video
    setBookmarks: (
      state,
      action: PayloadAction<{ videoId: string; bookmarks: number[] }>
    ) => {
      const { videoId, bookmarks } = action.payload;
      state.bookmarks[videoId] = bookmarks;
    },
    // Add a single bookmark
    addBookmark: (
      state,
      action: PayloadAction<{ videoId: string; timePosition: number }>
    ) => {
      const { videoId, timePosition } = action.payload;

      if (!state.bookmarks[videoId]) {
        state.bookmarks[videoId] = [];
      }

      // Only add if not already present
      if (!state.bookmarks[videoId].includes(timePosition)) {
        state.bookmarks[videoId] = [
          ...state.bookmarks[videoId],
          timePosition,
        ].sort((a, b) => a - b);
      }
    },
    // Set course completion status
    setCourseCompletionStatus: (state, action: PayloadAction<boolean>) => {
      state.courseCompletionStatus = action.payload;

      // If course is completed, also update the progress
      if (action.payload && state.courseProgress) {
        state.courseProgress.isCompleted = true;
        state.courseProgress.progress = 100;
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetch course data action states
    builder
      .addCase(fetchCourseDataApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseDataApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload.course;
        state.courseProgress = action.payload.progress;

        // Initialize other related state
        if (action.payload.progress) {
          state.completedChapters = action.payload.progress.completedChapters || [];
          state.courseCompletionStatus = !!action.payload.progress.isCompleted;
        }
      })
      .addCase(fetchCourseDataApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || "Failed to fetch course data";
      })

      // Handle update course progress action states
      .addCase(updateCourseProgressApi.pending, (state) => {
        // We can optionally set a loading state specifically for progress updates
      })
      .addCase(updateCourseProgressApi.fulfilled, (state, action) => {
        state.courseProgress = action.payload;
        if (action.payload) {
          state.completedChapters = action.payload.completedChapters || [];
          state.courseCompletionStatus = !!action.payload.isCompleted;
        }
      })
      .addCase(updateCourseProgressApi.rejected, (state, action) => {
        state.error = action.payload as string || "Failed to update course progress";
      });
  },
});

// Export actions
export const {
  setCurrentChapterApi,
  setCurrentVideoApi,
  markChapterAsCompleted,
  setBookmarks,
  addBookmark,
  setCourseCompletionStatus,
} = courseSlice.actions;

// Export reducer
export default courseSlice.reducer;
