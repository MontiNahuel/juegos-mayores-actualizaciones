/* Lleva en Redux la cuenta de cuánto falta para entrar al juego narrativo. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProgresoCargaNarrativa {
  fase: 'preparando' | 'imagenes' | 'lista';
  completados: number;
  total: number;
  fallidos: number;
  porcentaje: number;
}

const inicial: ProgresoCargaNarrativa & { fecha: string; error: string } = {
  fecha: '', fase: 'preparando', completados: 0, total: 0, fallidos: 0, porcentaje: 0, error: '',
};

// Redux sólo contiene información serializable. Los archivos viven en CacheStorage.
const carga = createSlice({
  name: 'narrativoCarga',
  initialState: inicial,
  reducers: {
    // Reinicia el avance de carga para la fecha elegida.
    iniciarCargaNarrativa: (_, { payload }: PayloadAction<string>) => ({ ...inicial, fecha: payload }),
    // Actualiza la carga sin hacer retroceder el porcentaje mostrado.
    actualizarCargaNarrativa: (state, { payload }: PayloadAction<ProgresoCargaNarrativa>) => {
      Object.assign(state, payload, { porcentaje: Math.max(state.porcentaje, payload.porcentaje) });
    },
    // Guarda el problema de carga para explicarlo en pantalla.
    fallarCargaNarrativa: (state, { payload }: PayloadAction<string>) => { state.error = payload; },
  },
});

export const { iniciarCargaNarrativa, actualizarCargaNarrativa, fallarCargaNarrativa } = carga.actions;
export default carga.reducer;
