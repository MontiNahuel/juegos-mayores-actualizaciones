/* Junta los estados compartidos de Redux en un solo lugar. */
import playerEconomyReducer from './playerEconomySlice';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    playerEconomy: playerEconomyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
