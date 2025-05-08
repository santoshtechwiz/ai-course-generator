import storage from "redux-persist/lib/storage"
import type { PersistConfig } from "redux-persist"
import type { RootState } from "./store"

// Define which parts of the state should be persisted
export const persistConfig: PersistConfig<RootState> = {
  key: "root",
  storage,
  whitelist: ["auth", "quiz", "user"], // Only persist these slices
  blacklist: [], // Don't persist these fields within the slices
  // Optional transforms for data serialization/deserialization
  transforms: [],
}

// Specific config for quiz state if needed
export const quizPersistConfig = {
  key: "quiz",
  storage,
  blacklist: ["isLoading", "error"], // Don't persist loading states and errors
}

// Specific config for auth state
export const authPersistConfig = {
  key: "auth",
  storage,
  blacklist: ["isLoading", "error"],
}

// Specific config for user state
export const userPersistConfig = {
  key: "user",
  storage,
  blacklist: ["isLoading"],
}
