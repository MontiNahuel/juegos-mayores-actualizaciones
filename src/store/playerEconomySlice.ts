/* Guarda el saldo y las reglas de la tienda para que todos los juegos vean lo mismo. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TiendaPaquete {
  id: string;
  vidas: number;
  puntos: number;
  popular?: boolean;
  badge?: string | null;
  descuento?: string | null;
}

export type SuscripcionTipo = 'basica' | 'premium';

const DEFAULT_PAQUETES: TiendaPaquete[] = [
  { id: 'pack_1', vidas: 1, puntos: 200, popular: false, badge: null, descuento: null },
  { id: 'pack_3', vidas: 3, puntos: 600, popular: true, badge: 'Popular', descuento: null },
  { id: 'pack_5', vidas: 5, puntos: 1000, popular: false, badge: null, descuento: null },
];

const DEFAULT_PUNTOS_POR_JUEGO: Record<string, number> = {
  wordle: 50,
  sopa_letras: 50,
  sudoku: 60,
  crucigrama: 70,
  narrativo: 80,
};

export interface PlayerEconomyState {
  vidas: number;
  puntos: number;
  costoVidaPuntos: number;
  costoPistaPuntos: number;
  costoDesbloqueoDiaPuntos: number;
  suscripcion: SuscripcionTipo;
  diasDesbloqueados: string[];
  paquetesTienda: TiendaPaquete[];
  puntosPorJuego: Record<string, number>;
  vidasMaximas: number | null;
  isLoading: boolean;
}

const initialState: PlayerEconomyState = {
  vidas: 5, puntos: 0, costoVidaPuntos: 200, costoPistaPuntos: 20, costoDesbloqueoDiaPuntos: 100,
  suscripcion: 'basica', diasDesbloqueados: [], paquetesTienda: DEFAULT_PAQUETES,
  puntosPorJuego: DEFAULT_PUNTOS_POR_JUEGO, vidasMaximas: null, isLoading: true,
};

const playerEconomySlice = createSlice({
  name: 'playerEconomy',
  initialState,
  reducers: {
    // Cambia sólo los datos confirmados; el resto del saldo queda como estaba.
    actualizarEconomia: (state, { payload }: PayloadAction<Partial<PlayerEconomyState>>) => {
      Object.assign(state, payload);
    },
    // Anota el día comprado una sola vez para que aparezca abierto en el calendario.
    agregarDiaDesbloqueado: (state, { payload }: PayloadAction<string>) => {
      if (!state.diasDesbloqueados.includes(payload)) state.diasDesbloqueados.push(payload);
    },
  },
});

export const { actualizarEconomia, agregarDiaDesbloqueado } = playerEconomySlice.actions;
export default playerEconomySlice.reducer;
