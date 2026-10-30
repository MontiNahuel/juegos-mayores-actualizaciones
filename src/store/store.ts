/* Junta los estados compartidos de Redux en un solo lugar. */
import playerEconomyReducer from './playerEconomySlice';
import { configureStore } from '@reduxjs/toolkit';
import narrativoSelectionReducer from './narrativoSelectionSlice';
import narrativoCargaReducer from './narrativoCargaSlice';

export const store = configureStore({
  reducer: {
    playerEconomy: playerEconomyReducer,
    narrativoSelection: narrativoSelectionReducer,
    narrativoCarga: narrativoCargaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
