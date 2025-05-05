import { combineReducers } from "@reduxjs/toolkit"
import { persistReducer } from "redux-persist"

import quizReducer from "./slices/quizSlice"
import userReducer from "./slices/userSlice"
import authReducer from "./slices/authSlice"
import { authPersistConfig, quizPersistConfig, userPersistConfig } from "./slices/persist-config"

// Apply persist config to individual reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)
const persistedQuizReducer = persistReducer(quizPersistConfig, quizReducer)
const persistedUserReducer = persistReducer(userPersistConfig, userReducer)

// Combine all reducers
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  quiz: persistedQuizReducer,
  user: persistedUserReducer,
})

export default rootReducer
