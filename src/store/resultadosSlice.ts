import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Resultado {
  id: string;
  imagen: string;
  texto: string;
  tipo: 'positivo' | 'negativo' | 'neutro';
  impacto: string;
}

// Mock temporal de la colección `resultados`.
const coleccion: Resultado[] = [
  { id: 'res-mercado', imagen: 'El mercado vuelve a abrir', texto: 'La decisión calma a los comerciantes y la plaza recupera su ritmo.', tipo: 'positivo', impacto: '+10 Tesoro' },
  { id: 'res-puente', imagen: 'El puente reparado', texto: 'Los viajeros vuelven a cruzar el río con seguridad.', tipo: 'positivo', impacto: '+10 Orden' },
  { id: 'res-bosque', imagen: 'El sendero en silencio', texto: 'La búsqueda se demora y el pueblo espera noticias.', tipo: 'neutro', impacto: 'Sin cambios' },
  { id: 'res-enfermeria', imagen: 'Hierbas para la enfermería', texto: 'La curandera logra atender a quienes lo necesitan.', tipo: 'positivo', impacto: '+10 Moral' },
  { id: 'res-guardia', imagen: 'La guardia organizada', texto: 'Los nuevos turnos devuelven tranquilidad a la ciudad.', tipo: 'positivo', impacto: '+10 Orden' },
  { id: 'res-archivo', imagen: 'Un documento encontrado', texto: 'El acuerdo perdido reaparece entre los registros antiguos.', tipo: 'neutro', impacto: 'Sin cambios' },
  { id: 'res-fiesta', imagen: 'La plaza celebra', texto: 'La cosecha reúne al reino y renueva el ánimo.', tipo: 'positivo', impacto: '+10 Moral' },
  { id: 'res-taller', imagen: 'Herramientas reparadas', texto: 'El taller recupera su capacidad de trabajo.', tipo: 'positivo', impacto: '+10 Graneros' },
  { id: 'res-mapa', imagen: 'La nueva ruta', texto: 'El camino es más largo de lo esperado, pero promete oportunidades.', tipo: 'neutro', impacto: 'Sin cambios' },
  { id: 'res-fuente', imagen: 'La fuente cerrada', texto: 'El pueblo debe buscar agua lejos de sus casas.', tipo: 'negativo', impacto: '-10 Moral' },
  { id: 'res-muralla', imagen: 'La muralla vigilada', texto: 'Las rondas nocturnas mantienen segura la frontera.', tipo: 'positivo', impacto: '+10 Orden' },
  { id: 'res-historia', imagen: 'Una historia compartida', texto: 'Los relatos de la corte acercan al pueblo al reino.', tipo: 'positivo', impacto: '+10 Moral' },
];

const resultadosSlice = createSlice({
  name: 'resultados',
  initialState: { coleccion, actual: null as Resultado | null },
  reducers: {
    mostrarResultado: (state, action: PayloadAction<string>) => {
      state.actual = state.coleccion.find((item) => item.id === action.payload) || null;
    },
    limpiarResultado: (state) => {
      state.actual = null;
    },
  },
});

export const { mostrarResultado, limpiarResultado } = resultadosSlice.actions;
export default resultadosSlice.reducer;
