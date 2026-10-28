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
    iniciarCargaNarrativa: (_, { payload }: PayloadAction<string>) => ({ ...inicial, fecha: payload }),
    actualizarCargaNarrativa: (state, { payload }: PayloadAction<ProgresoCargaNarrativa>) => {
      Object.assign(state, payload, { porcentaje: Math.max(state.porcentaje, payload.porcentaje) });
    },
    fallarCargaNarrativa: (state, { payload }: PayloadAction<string>) => { state.error = payload; },
  },
});

export const { iniciarCargaNarrativa, actualizarCargaNarrativa, fallarCargaNarrativa } = carga.actions;
export default carga.reducer;
