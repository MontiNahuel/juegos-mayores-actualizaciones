import { configureStore } from '@reduxjs/toolkit';
import narrativoSelectionReducer from './narrativoSelectionSlice';
import narrativoCargaReducer from './narrativoCargaSlice';

export const store = configureStore({
  reducer: {
    narrativoSelection: narrativoSelectionReducer,
    narrativoCarga: narrativoCargaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
