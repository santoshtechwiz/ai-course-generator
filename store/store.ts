import { configureStore } from "@reduxjs/toolkit"
import { persistStore } from "redux-persist"
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist"
import rootReducer from "./root-reducer"

// Configure the Redux store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore these paths in the state for serializability checks
        ignoredPaths: ["some.path.to.ignore"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
})

// Create the persistor
export const persistor = persistStore(store)

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
