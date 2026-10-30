/* Convierte el historial en una crónica que se pueda leer y comparar. */
import type { CatalogosCronica, EntradaCatalogoCronica, EstadoPartida, HistorialMesApi, HistorialPartidaApi } from '../narrativeService';

export const RECURSOS = [
  { clave: 'oro', nombre: 'Oro', color: '#a77324' },
  { clave: 'pueblo', nombre: 'Pueblo', color: '#387660' },
  { clave: 'ejercito', nombre: 'Ejército', color: '#486d98' },
  { clave: 'fe', nombre: 'Fe', color: '#79577e' },
] as const;

export type ClaveRecurso = typeof RECURSOS[number]['clave'];
type Valores = Partial<Record<ClaveRecurso, number>>;

export interface MesCronica {
  numero: number;
  registro: HistorialMesApi;
  valores: Valores;
  cambios: Partial<Record<ClaveRecurso, number | null>>;
  carta?: string;
  evento?: string;
  opcion?: string;
  resultado?: string;
  resultadoTexto?: string;
  conversacion?: string;
  decision?: string;
  decisionResultado?: string;
  impactoAfinidad: { personajeId: string; delta: number }[];
}

// Conserva los valores que sirven para armar las estadísticas.
const valoresValidos = (origen?: Record<string, number>): Valores =>
  Object.fromEntries(RECURSOS.flatMap(/* Prepara y reúne los resultados de cada elemento. */ ({ clave }) => {
    const valor = origen?.[clave];
    return Number.isFinite(valor) ? [[clave, Number(valor)]] : [];
  })) as Valores;

// El balance de un mes sólo se calcula si conocemos ambos extremos; así no
// atribuimos a un mes los cambios ocurridos en otro o en una partida incompleta.
export function construirCronica(historial: HistorialPartidaApi, estado: EstadoPartida, inicial: Record<string, number> | undefined, catalogos: CatalogosCronica) {
  // Arma un índice por identificador para encontrar los textos de la crónica.
  const indice = (elementos: EntradaCatalogoCronica[]) => new Map(elementos.filter(/* Conserva los elementos que cumplen esta condición. */ item => item._id || item.id).map(/* Prepara el resultado de cada elemento. */ item => [item._id || item.id, item]));
  const cartas = indice(catalogos.cartas);
  const eventos = indice(catalogos.eventos);
  const resultados = indice(catalogos.resultados);
  const conversaciones = indice(catalogos.conversaciones);
  const registros = (historial.historial_mensual || [])
    .filter(/* Conserva los elementos que cumplen esta condición. */ (mes): mes is HistorialMesApi => typeof mes === 'object' && Number.isInteger(mes.mes) && mes.mes > 0)
    .toSorted(/* Completa este paso con los datos recibidos por la operación. */ (a, b) => a.mes - b.mes);
  let anteriores = valoresValidos(inicial);
  let mesAnterior = 0;
  const meses: MesCronica[] = registros.map(/* Prepara el resultado de cada elemento. */ registro => {
    const valores = valoresValidos(registro.recursos_fin_mes);
    const cambios = Object.fromEntries(RECURSOS.map(/* Prepara el resultado de cada elemento. */ ({ clave }) => [
      clave, registro.mes === mesAnterior + 1 && valores[clave] !== undefined && anteriores[clave] !== undefined
        ? valores[clave] - anteriores[clave] : null,
    ])) as MesCronica['cambios'];
    anteriores = valores;
    mesAnterior = registro.mes;

    const carta = cartas.get(registro.carta_elegida_id || '');
    const evento = eventos.get(registro.evento_id || '');
    const resultado = resultados.get(registro.resultado_id || '');
    const conversacion = conversaciones.get(registro.conversacion_id || '');
    const decision = conversacion?.decisiones?.find(/* Busca el primer elemento que cumple esta condición. */ item => item.opcion === registro.decision_conversacion_opcion);
    return {
      numero: registro.mes, registro, valores, cambios,
      carta: carta?.nombre || carta?.titulo,
      evento: registro.evento_titulo || evento?.titulo,
      opcion: registro.opcion_texto || evento?.opciones?.find(/* Busca el primer elemento que cumple esta condición. */ opcion => opcion.id === registro.opcion_elegida_id)?.texto,
      resultado: registro.resultado || resultado?.titulo,
      resultadoTexto: registro.resultado_texto || resultado?.texto,
      conversacion: registro.conversacion_titulo || conversacion?.titulo,
      decision: registro.decision_texto || decision?.texto,
      decisionResultado: registro.decision_resultado_texto || decision?.resultado_texto,
      impactoAfinidad: (registro.impacto_afinidad || decision?.impacto_afinidad || []).map(/* Prepara el resultado de cada elemento. */ ({ personaje_id, delta }) => ({ personajeId: personaje_id, delta })),
    };
  });
  return {
    meses,
    inicial: valoresValidos(inicial),
    final: { ...anteriores, ...valoresValidos(estado.recursos) },
    totalMeses: Math.max(historial.modo_local ? 6 : 12, meses.at(-1)?.numero || 0),
    eventos: meses.filter(/* Conserva los elementos que cumplen esta condición. */ mes => mes.registro.evento_id).length,
    conversaciones: meses.filter(/* Conserva los elementos que cumplen esta condición. */ mes => mes.registro.conversacion_id).length,
  };
}
