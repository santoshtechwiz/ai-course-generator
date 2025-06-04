import storage from "redux-persist/lib/storage"
import type { PersistConfig } from "redux-persist"
import { RootState } from ".."


// Define which parts of the state should be persisted
export const persistConfig: PersistConfig<RootState> = {
  key: "root",
  storage,
  whitelist: ["auth", "quiz", "user", "subscription"], // Add subscription to persisted slices
  blacklist: [], // Don't persist these fields within the slices
  // Optional transforms for data serialization/deserialization
  transforms: [],
}

// Specific config for quiz state if needed
export const quizPersistConfig: PersistConfig<RootState["quiz"]> = {
  key: "quiz",
  storage,
  blacklist: ["isLoading", "error", "status"],
}

// Specific config for auth state
export const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "token"], // Persist only user and token fields
}

// Specific config for user state
export const userPersistConfig: PersistConfig<RootState["user"]> = {
  key: "user",
  storage,
  blacklist: ["loading", "error"],
}

// Add specific config for subscription
export const subscriptionPersistConfig: PersistConfig<RootState["subscription"]> = {
  key: "subscription",
  storage,
  blacklist: ["isLoading", "error", "isFetching"],
}

// Add specific config for flashcard
export const flashcardPersistConfig: PersistConfig<RootState["flashcard"]> = {
  key: "flashcard",
  storage,
  blacklist: ["loading", "error"],
}
