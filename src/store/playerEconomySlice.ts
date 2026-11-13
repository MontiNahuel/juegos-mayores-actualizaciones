import { DEFAULT_GRADE_POINTS, DEFAULT_TIME_GRADES, type ScoringConfig } from '../VISTAS/JUEGOS/classicScoring';
/* Guarda el saldo, la racha y las reglas activas para que todos los juegos vean lo mismo. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SuscripcionTipo = 'basica' | 'premium';

export interface RachaTramo {
  dias: number;
  valor: number;
}

export interface BonusRachaConfig {
  activo: boolean;
  modo: 'porcentaje' | 'puntos_fijos';
  tramos: RachaTramo[];
}

const DEFAULT_PUNTOS_POR_JUEGO: Record<string, number> = {
  wordle: 50,
  sopa_letras: 50,
  sudoku: 60,
  crucigrama: 70,
  narrativo: 80,
};

export interface PlayerEconomyState extends ScoringConfig {
  puntos: number;
  racha: number;
  rachaUltimaFecha: string | null;
  rachaHoyIngresada: boolean;
  bonusRacha: BonusRachaConfig | null;
  costoPistaPuntos: number;
  costoDesbloqueoDiaPuntos: number;
  suscripcion: SuscripcionTipo;
  diasDesbloqueados: string[];
  puntosPorJuego: Record<string, number>;
  isLoading: boolean;
}

const initialState: PlayerEconomyState = {
  puntosPorCalificacion: DEFAULT_GRADE_POINTS,
  escalasTiempoPorJuego: DEFAULT_TIME_GRADES,
  puntos: 0,
  racha: 0,
  rachaUltimaFecha: null,
  rachaHoyIngresada: false,
  bonusRacha: null,
  costoPistaPuntos: 20,
  costoDesbloqueoDiaPuntos: 100,
  suscripcion: 'basica',
  diasDesbloqueados: [],
  puntosPorJuego: DEFAULT_PUNTOS_POR_JUEGO,
  isLoading: true,
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
    // Restablece los indicadores del usuario al cerrar sesión o entrar como invitado.
    resetearEconomia: (state) => {
      state.puntos = 0;
      state.racha = 0;
      state.rachaUltimaFecha = null;
      state.rachaHoyIngresada = false;
      state.bonusRacha = null;
      state.suscripcion = 'basica';
      state.diasDesbloqueados = [];
      state.isLoading = false;
    },
  },
});

export const { actualizarEconomia, agregarDiaDesbloqueado, resetearEconomia } = playerEconomySlice.actions;
export default playerEconomySlice.reducer;
