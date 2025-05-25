import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';

interface UiState {
  // Global loading indicators
  isLoading: boolean;
  loadingMessage: string | null;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration: number;
  }>;
  
  // Modal state
  activeModal: string | null;
  modalData: any;
  
  // Theme and preferences
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  
  // Navigation state
  previousRoute: string | null;
}

const initialState: UiState = {
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  activeModal: null,
  modalData: null,
  theme: 'system',
  fontSize: 'medium',
  previousRoute: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || null;
    },
    
    addToast: (state, action: PayloadAction<Omit<UiState['toasts'][0], 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    
    setActiveModal: (state, action: PayloadAction<{ modal: string | null; data?: any }>) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    
    setTheme: (state, action: PayloadAction<UiState['theme']>) => {
      state.theme = action.payload;
    },
    
    setFontSize: (state, action: PayloadAction<UiState['fontSize']>) => {
      state.fontSize = action.payload;
    },
    
    setPreviousRoute: (state, action: PayloadAction<string>) => {
      state.previousRoute = action.payload;
    },
  },
});

export const {
  setLoading,
  addToast,
  removeToast,
  setActiveModal,
  setTheme,
  setFontSize,
  setPreviousRoute,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectIsLoading = (state: RootState) => state.ui.isLoading;
export const selectLoadingMessage = (state: RootState) => state.ui.loadingMessage;
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectActiveModal = (state: RootState) => state.ui.activeModal;
export const selectModalData = (state: RootState) => state.ui.modalData;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectFontSize = (state: RootState) => state.ui.fontSize;
export const selectPreviousRoute = (state: RootState) => state.ui.previousRoute;
