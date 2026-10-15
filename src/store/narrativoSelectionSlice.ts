import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PersonajeCard } from '../VISTAS/JUEGOS/NARRATIVO/CARDSELECTION/card';

type SelectionPhase = 'primera' | 'segunda' | 'completa';

export type AtributosReino = Record<string, number>;

interface NarrativoSelectionState {
  desafioId: string | null;
  primeraSeleccion: PersonajeCard[];
  segundaSeleccion: PersonajeCard[];
  phase: SelectionPhase;
  atributos: AtributosReino;
}

interface SelectionPayload {
  desafioId: string;
  personajes: PersonajeCard[];
}

const initialState: NarrativoSelectionState = {
  desafioId: null,
  primeraSeleccion: [],
  segundaSeleccion: [],
  phase: 'primera',
  // Respaldo local hasta que el setup del universo devuelve sus recursos reales.
  atributos: { oro: 50, pueblo: 50, ejercito: 50, fe: 50 },
};

const narrativoSelectionSlice = createSlice({
  name: 'narrativoSelection',
  initialState,
  reducers: {
    guardarPrimeraSeleccion: (state, action: PayloadAction<SelectionPayload>) => {
      if (action.payload.personajes.length !== 3) return;

      state.desafioId = action.payload.desafioId;
      state.primeraSeleccion = action.payload.personajes;
      state.segundaSeleccion = [];
      state.phase = 'segunda';
    },
    guardarSegundaSeleccion: (state, action: PayloadAction<SelectionPayload>) => {
      if (action.payload.personajes.length !== 3) return;

      state.desafioId = action.payload.desafioId;
      state.segundaSeleccion = action.payload.personajes;
      state.phase = 'completa';
    },
    actualizarAtributos: (state, action: PayloadAction<Partial<AtributosReino>>) => {
      Object.assign(state.atributos, action.payload);
    },
    reiniciarSeleccionNarrativa: () => initialState,
  },
});

export const {
  guardarPrimeraSeleccion,
  guardarSegundaSeleccion,
  actualizarAtributos,
  reiniciarSeleccionNarrativa,
} = narrativoSelectionSlice.actions;

export default narrativoSelectionSlice.reducer;
