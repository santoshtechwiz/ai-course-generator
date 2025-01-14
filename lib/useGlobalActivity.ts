'use client'

import { useActivity } from '../app/providers/activityContext';
import { logActivity as logActivityToServer } from './logActivity';

export function useGlobalActivity() {
  const { state, dispatch } = useActivity();

  const logActivity = async (activity: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: string;
  }) => {
    // Add activity to global state
    dispatch({ type: 'ADD_ACTIVITY', payload: activity });

    // Log activity to server
    await logActivityToServer(activity);
  };

  const setUser = (user: { id: string; name: string; email: string } | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const clearActivities = () => {
    dispatch({ type: 'CLEAR_ACTIVITIES' });
  };

  return {
    activities: state.activities,
    user: state.user,
    logActivity,
    setUser,
    clearActivities,
  };
}

