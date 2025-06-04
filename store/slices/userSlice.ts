import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";

// Types
export interface UserPreferences {
  theme: "light" | "dark" | "system"
  notifications: boolean
  language: string
}

export interface UserState {
  profile: {
    id: string | null
    name: string | null
    email: string | null
    image: string | null
  }
  preferences: UserPreferences
  statistics: {
    quizzesCompleted: number
    averageScore: number
    totalTimeSpent: number
  }
  loading: boolean
  error: string | null
}

// Initial state
const initialState: UserState = {
  profile: {
    id: null,
    name: null,
    email: null,
    image: null,
  },
  preferences: {
    theme: "system",
    notifications: true,
    language: "en",
  },
  statistics: {
    quizzesCompleted: 0,
    averageScore: 0,
    totalTimeSpent: 0,
  },
  loading: false,
  error: null,
}

// Async thunks
export const fetchUserProfile = createAsyncThunk("user/fetchProfile", async (userId: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch user profile")
    }
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch user profile")
  }
})

export const updateUserPreferences = createAsyncThunk(
  "user/updatePreferences",
  async ({ userId, preferences }: { userId: string; preferences: Partial<UserPreferences> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      })
      if (!response.ok) {
        throw new Error("Failed to update preferences")
      }
      return await response.json()
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update preferences")
    }
  },
)

// Slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<Partial<UserState["profile"]>>) => {
      state.profile = { ...state.profile, ...action.payload }
    },
    setUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    updateUserStatistics: (state, action: PayloadAction<Partial<UserState["statistics"]>>) => {
      state.statistics = { ...state.statistics, ...action.payload }
    },
    // When a user completes a quiz, update their statistics
    recordQuizCompletion: (state, action: PayloadAction<{ score: number; timeSpent: number }>) => {
      const { score, timeSpent } = action.payload
      const { quizzesCompleted, averageScore, totalTimeSpent } = state.statistics

      // Calculate new average score
      const newTotalScore = averageScore * quizzesCompleted + score
      const newQuizzesCompleted = quizzesCompleted + 1
      const newAverageScore = newTotalScore / newQuizzesCompleted

      // Update statistics
      state.statistics = {
        quizzesCompleted: newQuizzesCompleted,
        averageScore: newAverageScore,
        totalTimeSpent: totalTimeSpent + timeSpent,
      }
    },
    clearUserState: (state) => {
      // Reset to initial state except preferences
      state.profile = initialState.profile
      state.statistics = initialState.statistics
      state.error = null
      // Keep preferences even when logged out
    },
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = { ...state.profile, ...action.payload.profile }
        state.statistics = { ...state.statistics, ...action.payload.statistics }
        state.preferences = { ...state.preferences, ...action.payload.preferences }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || "Failed to fetch user profile"
      })

    // Update preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading = false
        state.preferences = { ...state.preferences, ...action.payload.preferences }
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || "Failed to update preferences"
      })
  },
})

// Export actions
export const { setUserProfile, setUserPreferences, updateUserStatistics, recordQuizCompletion, clearUserState } =
  userSlice.actions

// Export reducer
export default userSlice.reducer

// Add proper selectors that transform the data
// Base selectors for accessing parts of the state
export const selectUserState = (state: RootState) => state.user;
export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserPreferences = (state: RootState) => state.user.preferences;
export const selectUserStatistics = (state: RootState) => state.user.statistics;

// Derived selectors with transformations
export const selectFormattedUser = createSelector(
  [selectUserProfile],
  (profile) => {
    if (!profile.id) return null;
    return {
      ...profile,
      displayName: profile.name || 'Anonymous User',
      avatarUrl: profile.image || '/default-avatar.png',
      isComplete: Boolean(profile.name && profile.email)
    };
  }
);

export const selectUserThemePreference = createSelector(
  [selectUserPreferences],
  (preferences) => {
    return {
      currentTheme: preferences.theme,
      isDarkMode: preferences.theme === 'dark',
      isSystemTheme: preferences.theme === 'system',
      isLightMode: preferences.theme === 'light'
    };
  }
);

export const selectUserStats = createSelector(
  [selectUserStatistics],
  (statistics) => {
    return {
      ...statistics,
      formattedScore: `${statistics.averageScore.toFixed(1)}%`,
      formattedTime: `${Math.round(statistics.totalTimeSpent / 60)} min`,
      hasCompletedQuizzes: statistics.quizzesCompleted > 0
    };
  }
);

// Custom hook to get the current user
export function useCurrentUser() {
  const { user } = useAuth()
  return user
}
