import { configureStore } from '@reduxjs/toolkit';
import narrativoSelectionReducer from './narrativoSelectionSlice';

export const store = configureStore({
  reducer: {
    narrativoSelection: narrativoSelectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
