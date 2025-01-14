'use client'

import React, { createContext, useReducer, useContext, ReactNode } from 'react';

type Activity = {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: string
};

type State = {
  activities: Activity[];
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type Action =
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'SET_USER'; payload: State['user'] }
  | { type: 'CLEAR_ACTIVITIES' };

const initialState: State = {
  activities: [],
  user: null,
};

const ActivityContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

function activityReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: [...state.activities, action.payload],
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ACTIVITIES':
      return {
        ...state,
        activities: [],
      };
    default:
      return state;
  }
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(activityReducer, initialState);

  return (
    <ActivityContext.Provider value={{ state, dispatch }}>
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivity = () => useContext(ActivityContext);

