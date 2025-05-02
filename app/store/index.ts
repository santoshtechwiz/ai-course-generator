import { configureStore } from "@reduxjs/toolkit"
import quizReducer from "./quizSlice"
import subscriptionReducer from "./subscriptionSlice"
import { subscriptionStorageMiddleware } from "./subscription-provider"

export const store = configureStore({
  reducer: {
    quiz: quizReducer,
    subscription: subscriptionReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(subscriptionStorageMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
