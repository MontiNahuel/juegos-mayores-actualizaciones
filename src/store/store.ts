import { configureStore } from '@reduxjs/toolkit';
import eventosReducer from './eventosSlice';
import narrativoSelectionReducer from './narrativoSelectionSlice';
import resultadosReducer from './resultadosSlice';

export const store = configureStore({
  reducer: {
    eventos: eventosReducer,
    narrativoSelection: narrativoSelectionReducer,
    resultados: resultadosReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
