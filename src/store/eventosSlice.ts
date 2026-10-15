import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Evento {
  id: string;
  titulo: string;
  imagen: string;
  texto: string;
  resultadoId: string;
  opciones: [string, string];
  opcionSecreta: { texto: string; requiere: string };
}

// Mock temporal: después vendrá de la colección de eventos.
const mazo: Evento[] = [
  { id: 'mercado', titulo: 'El mercado', imagen: 'El mercado del reino', texto: 'Los comerciantes piden menos impuestos.', resultadoId: 'res-mercado', opciones: ['Bajar los impuestos', 'Mantener el precio'], opcionSecreta: { texto: 'Pedir consejo a la consejera', requiere: 'consejera' } },
  { id: 'puente', titulo: 'El puente', imagen: 'Un puente dañado', texto: 'El puente principal necesita una reparación.', resultadoId: 'res-puente', opciones: ['Repararlo hoy', 'Esperar al verano'], opcionSecreta: { texto: 'Enviar a la artesana', requiere: 'artesana' } },
  { id: 'bosque', titulo: 'El bosque', imagen: 'Un sendero en el bosque', texto: 'Un viajero no volvió de su recorrido.', resultadoId: 'res-bosque', opciones: ['Cerrar el camino', 'Enviar un mensaje'], opcionSecreta: { texto: 'Mandar al explorador', requiere: 'explorador' } },
  { id: 'enfermeria', titulo: 'La enfermería', imagen: 'La enfermería real', texto: 'La enfermería se quedó sin hierbas.', resultadoId: 'res-enfermeria', opciones: ['Comprar hierbas', 'Pedir ayuda al pueblo'], opcionSecreta: { texto: 'Hablar con la curandera', requiere: 'curandera' } },
  { id: 'guardia', titulo: 'La guardia', imagen: 'La puerta del castillo', texto: 'La guardia necesita un nuevo plan de turnos.', resultadoId: 'res-guardia', opciones: ['Cambiar los turnos', 'Dejarlo igual'], opcionSecreta: { texto: 'Consultar al capitán', requiere: 'capitan' } },
  { id: 'archivo', titulo: 'El archivo', imagen: 'El archivo del castillo', texto: 'Falta el registro de un antiguo acuerdo.', resultadoId: 'res-archivo', opciones: ['Buscar otra copia', 'Escribir uno nuevo'], opcionSecreta: { texto: 'Revisar con la cronista', requiere: 'cronista' } },
  { id: 'fiesta', titulo: 'La fiesta', imagen: 'La plaza del reino', texto: 'El pueblo propone una fiesta de cosecha.', resultadoId: 'res-fiesta', opciones: ['Aceptar la propuesta', 'Dejarla para más adelante'], opcionSecreta: { texto: 'Escuchar a la consejera', requiere: 'consejera' } },
  { id: 'taller', titulo: 'El taller', imagen: 'El taller real', texto: 'Las herramientas del reino están gastadas.', resultadoId: 'res-taller', opciones: ['Comprar herramientas', 'Reparar las actuales'], opcionSecreta: { texto: 'Pedir ideas a la artesana', requiere: 'artesana' } },
  { id: 'mapa', titulo: 'El mapa', imagen: 'Un mapa antiguo', texto: 'Apareció una ruta que nadie conoce.', resultadoId: 'res-mapa', opciones: ['Ignorar la ruta', 'Estudiar el mapa'], opcionSecreta: { texto: 'Preguntar al explorador', requiere: 'explorador' } },
  { id: 'fuente', titulo: 'La fuente', imagen: 'La fuente del pueblo', texto: 'El agua de la fuente ya no es clara.', resultadoId: 'res-fuente', opciones: ['Cerrar la fuente', 'Traer agua de otro lugar'], opcionSecreta: { texto: 'Llamar a la curandera', requiere: 'curandera' } },
  { id: 'muralla', titulo: 'La muralla', imagen: 'La muralla exterior', texto: 'Una parte de la muralla necesita vigilancia.', resultadoId: 'res-muralla', opciones: ['Reforzarla', 'Vigilarla de noche'], opcionSecreta: { texto: 'Encargarlo al capitán', requiere: 'capitan' } },
  { id: 'historia', titulo: 'La historia', imagen: 'Una sala de relatos', texto: 'Los niños piden conocer la historia del reino.', resultadoId: 'res-historia', opciones: ['Organizar una charla', 'Preparar un libro'], opcionSecreta: { texto: 'Invitar a la cronista', requiere: 'cronista' } },
];

const eventosSlice = createSlice({
  name: 'eventos',
  initialState: { mazo, actual: mazo[0] },
  reducers: {
    mostrarEvento: (state, action: PayloadAction<string>) => {
      const evento = state.mazo.find((item) => item.id === action.payload);
      if (evento) state.actual = evento;
    },
  },
});

export const { mostrarEvento } = eventosSlice.actions;
export default eventosSlice.reducer;
