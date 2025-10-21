import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { storage } from '@/lib/storage';
import { EventReplayer } from '@/utils/progress-events';
import { ProgressEventType } from '@/types/progress-events';
import type { 
  ProgressEvent,
  CourseProgressUpdatedEvent,
  QuizCompletedEvent,
  QuestionAnsweredEvent,
  BaseProgressEvent,
  VideoWatchedEvent,
} from '@/types/progress-events';

// Make the imports available;
;

// ... (keeping all your existing interfaces)

// Batch processing types
interface EventBatch {
  batchId: string;
  events: ProgressEvent[];
  createdAt: number;
  lastUpdatedAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Initial state type
interface ProgressEventsState {
  events: ProgressEvent[];
  pendingEvents: ProgressEvent[];
  failedEvents: ProgressEvent[];
  eventBatches: Record<string, EventBatch>;
  debouncedEvents: Record<string, ProgressEvent>;
  lastSyncedAt: number | null;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgressEventsState = {
  events: [],
  pendingEvents: [],
  failedEvents: [],
  eventBatches: {},
  debouncedEvents: {},
  lastSyncedAt: null,
  isOnline: true,
  isLoading: false,
  error: null
};

// Batch utility functions
const processBatch = (events: ProgressEvent[]): EventBatch => {
  if (!events || events.length === 0) {
    throw new Error('Cannot process empty batch');
  }

  const batchId = events[0]?.batchId || crypto.randomUUID();
  const now = Date.now();
  
  // Deduplicate events within the batch
  const uniqueEvents = Array.from(new Map(
    events.map(event => [
      `${event.type}_${event.entityId}_${event.userId}`,
      event
    ])
  ).values());
  
  // Sort by priority and timestamp
  const sortedEvents = uniqueEvents.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp - a.timestamp;
  });
  
  return {
    batchId,
    events: sortedEvents,
    createdAt: now,
    lastUpdatedAt: now,
    status: 'pending'
  };
};

/**
 * Thunk to synchronize pending events with the server
 */
export const syncEventsWithServer = createAsyncThunk<
  { syncedEvents: string[]; failedEvents: string[] },
  void,
  { state: RootState; rejectValue: string }
>('progressEvents/syncWithServer', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState;
    const { pendingEvents } = state.progressEvents;

    if (pendingEvents.length === 0) {
      return { syncedEvents: [], failedEvents: [] };
    }

    // Group events by type and entityId
    const groupedEvents = pendingEvents.reduce((groups: Record<string, ProgressEvent[]>, event: ProgressEvent) => {
      let key = `${event.type}_${event.entityId}_${event.userId}`;
      
      // For video progress events, use a more specific key to track individual segments
      if (event.type === ProgressEventType.VIDEO_WATCHED) {
        const videoEvent = event as VideoWatchedEvent;
        // Round progress to nearest 5% to reduce update frequency
        const progress = Math.round((videoEvent.metadata.progress || 0) * 20) / 20;
        key = `${key}_${progress}`;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
      return groups;
    }, {});

    // For each group, optimize based on event type
    console.log(`Optimizing ${Object.keys(groupedEvents).length} event groups...`);
    console.log(`Batching ${pendingEvents.length} pending events into groups...`);
    const batchedEvents = Object.values(groupedEvents)
      .map(events => {
        try {
          if (!Array.isArray(events) || events.length === 0) {
            console.warn('Invalid event group:', events);
            return null;
          }

          if (events[0]?.type === ProgressEventType.VIDEO_WATCHED) {
            // For video watched events, intelligently merge progress
            const sortedEvents = events
              .filter((e): e is VideoWatchedEvent => e.type === ProgressEventType.VIDEO_WATCHED)
              .sort((a, b) => b.timestamp - a.timestamp);

            if (sortedEvents.length === 0) {
              console.warn('No valid video watch events found in group');
              return null;
            }

            // Take the latest event as base
            const latest = sortedEvents[0];
            
            // If this is a completion event (progress >= 0.95), prioritize it
            if (latest.metadata.progress >= 0.95) {
              console.log('Found completion event, prioritizing:', latest);
              return latest;
            }

            // For regular progress events, merge if they're within 30 seconds
            const recentEvents = sortedEvents.filter(e => 
              Math.abs(e.timestamp - latest.timestamp) <= 30000
            );

            const mergedEvent: VideoWatchedEvent = {
              ...latest,
              metadata: {
                ...latest.metadata,
                progress: Math.max(...recentEvents.map(e => e.metadata.progress)),
                playedSeconds: Math.max(...recentEvents.map(e => e.metadata.playedSeconds))
              }
            };

            console.log(`Merged ${recentEvents.length} video watch events into one:`, mergedEvent);
            return mergedEvent;
          }

          // For other events, keep the most recent
          const latestEvent = events[events.length - 1];
          if (!latestEvent) {
            console.warn('No valid event found in group');
            return null;
          }
          return latestEvent;
        } catch (error) {
          console.error('Error processing event group:', error);
          return null;
        }
      })
      .filter((event): event is ProgressEvent => event !== null);

    console.log(`Reduced to ${batchedEvents.length} events after batching`);

    // Validate batched events before sending
    const validatedEvents = batchedEvents.filter(event => {
      if (!event.id || !event.userId || !event.timestamp || !event.type || !event.entityId || !event.entityType) {
        console.warn('Dropping invalid event:', event);
        return false;
      }
      return true;
    });

    if (validatedEvents.length === 0) {
      console.warn('No valid events to sync after validation');
      return { 
        syncedEvents: [], 
        failedEvents: pendingEvents.map((e: ProgressEvent) => e.id)
      };
    }

    const maxAttempts = 3;
    const backoffMs = 1000; // Start with 1 second
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch('/api/progress/events/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Batch-ID': crypto.randomUUID()
          },
          body: JSON.stringify({ 
            events: validatedEvents,
            timestamp: Date.now()
          })
        });

        const errorData = !response.ok ? await response.json().catch(() => ({})) : null;
        
        if (!response.ok) {
          console.error('Sync request failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          // If it's a server error, retry
          if (response.status >= 500) {
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, backoffMs * attempts));
              continue;
            }
          }
          
          return { 
            syncedEvents: [], 
            failedEvents: validatedEvents.map(e => e.id)
          };
        }

        const responseData = await response.json();
        
        if (responseData.error) {
          throw new Error(responseData.error);
        }

        console.log('Sync successful:', {
          synced: validatedEvents.length,
          response: responseData
        });

        return {
          ...responseData,
          syncedEvents: validatedEvents.map(e => e.id),
          failedEvents: []
        };
      } catch (error) {
        console.error('Sync attempt failed:', error);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, backoffMs * attempts));
          continue;
        }

        return {
          syncedEvents: [],
          failedEvents: validatedEvents.map(e => e.id)
        };
      }
    }

    // If all attempts failed, return failed events
    return {
      syncedEvents: [],
      failedEvents: validatedEvents.map(e => e.id)
    };
  } catch (error) {
    console.error('Sync error:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Sync failed');
  }
});

const loadEventsFromStorage = createAsyncThunk(
  'progressEvents/loadFromStorage',
  async (userId: string) => {
    const stored = storage.getItem(`progress_events_${userId}`) || [];
    return stored || [];
  }
);

// Create the slice
const progressEventsSlice = createSlice({
  name: 'progressEvents',
  initialState,
  reducers: {
    addEvent: (state, action: PayloadAction<ProgressEvent>) => {
      const event = action.payload;
      const now = Date.now();

      // Generate debounce key based on event type
      let debounceKey = `${event.type}_${event.entityId}_${event.userId}`;
      let debounceInterval = 1000; // Default 1s debounce

      if (event.type === ProgressEventType.VIDEO_WATCHED) {
        const videoEvent = event as VideoWatchedEvent;
        // For video progress, use 5% increments and longer debounce
        const progress = Math.round(videoEvent.metadata.progress * 20) / 20;
        debounceKey = `${debounceKey}_${progress}`;
        debounceInterval = 5000; // 5s debounce for video progress
      }

      const lastEvent = state.debouncedEvents[debounceKey];
      const shouldDebounce = lastEvent && (now - lastEvent.timestamp) < debounceInterval;

      if (shouldDebounce) {
        console.log(`Debouncing event: ${event.type}`, {
          timeSinceLastEvent: now - lastEvent.timestamp,
          interval: debounceInterval
        });
        return;
      }

      // Update debounced events
      state.debouncedEvents[debounceKey] = event;

      // Add to events log
      state.events.push(event);

      // Add to pending events for sync
      state.pendingEvents.push(event);

      // Keep events sorted by timestamp
      state.events.sort((a, b) => a.timestamp - b.timestamp);

      // Limit event history to prevent memory issues
      if (state.events.length > 1000) {
        state.events = state.events.slice(-1000);
      }

      // Cleanup old debounced events
      const debounceCleanupTime = now - 60000; // 1 minute
      Object.entries(state.debouncedEvents).forEach(([key, event]) => {
        if (event.timestamp < debounceCleanupTime) {
          delete state.debouncedEvents[key];
        }
      });

      // Persist to localStorage
      storage.setItem(`progress_events_${event.userId}`, state.events);
    },
    retryFailedEvents: (state) => {
      state.pendingEvents.push(...state.failedEvents);
      state.failedEvents = [];
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncEventsWithServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncEventsWithServer.fulfilled, (state, action) => {
        state.isLoading = false;
        const { syncedEvents = [], failedEvents = [] } = action.payload || {};

        if (Array.isArray(syncedEvents)) {
          syncedEvents.forEach((eventId) => {
            const index = state.pendingEvents.findIndex(e => e.id === eventId);
            if (index !== -1) {
              state.pendingEvents.splice(index, 1);
            }
          });
        }

        if (Array.isArray(failedEvents)) {
          failedEvents.forEach((eventId) => {
            const index = state.pendingEvents.findIndex(e => e.id === eventId);
            if (index !== -1) {
              const failedEvent = state.pendingEvents.splice(index, 1)[0];
              state.failedEvents.push(failedEvent);
            }
          });
        }

        state.lastSyncedAt = Date.now();
        
        // Trigger refetch from course progress hook to sync with latest DB state
        setTimeout(() => {
          // This will be picked up by components using useCourseProgressSync
          window.dispatchEvent(new CustomEvent('progressSynced', { detail: { timestamp: Date.now() } }));
        }, 100);
      })
      .addCase(syncEventsWithServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Sync failed';
      })
      .addCase(loadEventsFromStorage.fulfilled, (state, action) => {
        state.events = action.payload;
      });
  }
});

export const {
  addEvent,
  
  
  
} = progressEventsSlice.actions;

// Base selectors
const selectEventLog = (state: RootState) => state.progressEvents.events;
const selectPendingEvents = (state: RootState) => state.progressEvents.pendingEvents;
const selectFailedEvents = (state: RootState) => state.progressEvents.failedEvents;
const selectLastSyncedAt = (state: RootState) => state.progressEvents.lastSyncedAt;
const selectIsOnline = (state: RootState) => state.progressEvents.isOnline;

// Course progress selectors
export const selectCourseProgressFromEvents = createSelector(
  [selectEventLog],
  (events: ProgressEvent[]) => {
    return events.reduce((progress: Record<string, { progress: number; completedChapters: number[] }>, event) => {
      if (event.type === ProgressEventType.COURSE_PROGRESS_UPDATED) {
        const courseEvent = event as CourseProgressUpdatedEvent;
        progress[event.entityId] = {
          progress: courseEvent.metadata.progress,
          completedChapters: courseEvent.metadata.completedChapters
        };
      }
      return progress;
    }, {});
  }
);

export const selectCourseCompletionPercentage = createSelector(
  [selectCourseProgressFromEvents, (_state: RootState, courseId: string) => courseId],
  (courseProgress, courseId) => {
    const progress = courseProgress[courseId];
    return progress?.progress || 0;
  }
);

// Quiz progress selectors
export const selectQuizProgressFromEvents = createSelector(
  [selectEventLog],
  (events: ProgressEvent[]) => {
    return events.reduce((progress: Record<string, QuizCompletedEvent['metadata'] & { completedAt: number }>, event) => {
      if (event.type === ProgressEventType.QUIZ_COMPLETED) {
        const quizEvent = event as QuizCompletedEvent;
        progress[event.entityId] = {
          ...quizEvent.metadata,
          completedAt: event.timestamp
        };
      }
      return progress;
    }, {});
  }
);

export const selectCurrentQuizAnswers = createSelector(
  [selectEventLog, (_state: RootState, quizId: string) => quizId],
  (events: ProgressEvent[], quizId) => {
    return events
      .filter((event): event is QuestionAnsweredEvent => 
        event.type === ProgressEventType.QUESTION_ANSWERED && 
        (event as QuestionAnsweredEvent).metadata.quizId === quizId
      )
      .reduce((answers: Record<string, QuestionAnsweredEvent['metadata']>, event) => {
        answers[event.entityId] = {
          quizId: event.metadata.quizId,
          questionIndex: event.metadata.questionIndex,
          selectedOptionId: event.metadata.selectedOptionId,
          userAnswer: event.metadata.userAnswer,
          isCorrect: event.metadata.isCorrect,
          timeSpent: event.metadata.timeSpent
        };
        return answers;
      }, {});
  }
);

export const selectQuizCompletionPercentage = createSelector(
  [selectQuizProgressFromEvents, (_state: RootState, quizId: string) => quizId],
  (quizProgress, quizId) => {
    const progress = quizProgress[quizId];
    return progress?.percentage || 0;
  }
);

export default progressEventsSlice.reducer;