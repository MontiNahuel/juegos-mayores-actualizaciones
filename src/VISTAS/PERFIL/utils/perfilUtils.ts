/* Formato y cálculos de la página de perfil, sin depender de la zona del navegador. */
import type {
  MedallasMes,
  MedallasPorCalificacion,
  PerfilResumen,
  RendimientoJuego,
  SituacionConsejo,
} from '../services/perfilService';
import type { PrecioPlan, PeriodoCobro } from '../services/planesService';

export const CALIFICACIONES = ['S', 'A', 'B', 'C', 'F'] as const;
export type Calificacion = (typeof CALIFICACIONES)[number];

/** Las F no suman como medalla: el panel de progreso cuenta solo S, A, B y C. */
export const CALIFICACIONES_CONTADAS = ['S', 'A', 'B', 'C'] as const;

/** Colores del sello del calendario, aclarados para el fondo oscuro del menú. */
export const ESTILO_CALIFICACION: Record<Calificacion, string> = {
  S: 'text-[#F0CC80] bg-[#F0CC80]/10',
  A: 'text-[#8FD9CC] bg-[#8FD9CC]/10',
  B: 'text-[#A9C8EE] bg-[#A9C8EE]/10',
  C: 'text-[#C3CEDA] bg-[#C3CEDA]/10',
  F: 'text-[#E79586] bg-[#E79586]/10',
};

export const MEDALLAS_VACIAS: MedallasPorCalificacion = { S: 0, A: 0, B: 0, C: 0, F: 0 };

function parsearFecha(iso: string): Date | null {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

export function medallasDe(
  bloque: Record<string, MedallasPorCalificacion> | undefined,
  juego: string,
): MedallasPorCalificacion {
  return bloque?.[juego] ?? MEDALLAS_VACIAS;
}

export function totalMedallas(medallas: MedallasPorCalificacion): number {
  return CALIFICACIONES.reduce((total, calificacion) => total + medallas[calificacion], 0);
}

/** Suma los sellos de varios juegos en un único bloque. */
export function sumarMedallas(
  bloques: (MedallasPorCalificacion | undefined)[],
): MedallasPorCalificacion {
  return bloques.reduce<MedallasPorCalificacion>(
    (total, bloque) => {
      if (!bloque) return total;
      for (const calificacion of CALIFICACIONES) {
        total[calificacion] += bloque[calificacion] ?? 0;
      }
      return total;
    },
    { ...MEDALLAS_VACIAS },
  );
}

/** Rendimiento conjunto: solo se suman jugadas y se toma el intento más reciente. */
export function rendimientoAgregado(
  rendimiento: Record<string, RendimientoJuego> | undefined,
  juegos: string[],
): RendimientoJuego {
  const bloques = juegos
    .map((juego) => rendimiento?.[juego])
    .filter((bloque): bloque is RendimientoJuego => Boolean(bloque));
  const fechas = bloques
    .map((bloque) => bloque.ultima_fecha)
    .filter((fecha): fecha is string => Boolean(fecha))
    .sort();
  return {
    completadas: bloques.reduce((total, bloque) => total + bloque.completadas, 0),
    mejor_tiempo_segundos: null,
    promedio_tiempo_segundos: null,
    ultima_fecha: fechas[fechas.length - 1] ?? null,
  };
}

export function formatearMes(mes: string): string {
  const [anio, numeroMes] = mes.split('-').map(Number);
  if (!anio || !numeroMes) return mes;
  const texto = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(anio, numeroMes - 1, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearDuracion(segundos: number | null | undefined): string {
  if (typeof segundos !== 'number' || !Number.isFinite(segundos) || segundos < 0) {
    return '—';
  }
  const minutos = Math.floor(segundos / 60);
  const resto = Math.round(segundos % 60);
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/** Precio del plan con su moneda y periodo; sin monto se informa que falta definirlo. */
export function formatearPrecioPlan(
  precio: PrecioPlan | null | undefined,
  periodo: PeriodoCobro = 'mensual',
): string {
  const monto = Number(precio?.monto);
  if (!precio || precio.monto === null || !Number.isFinite(monto)) return 'Precio a confirmar';
  const moneda = /^[A-Z]{3}$/.test(precio.moneda) ? precio.moneda : 'ARS';
  let texto: string;
  try {
    texto = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 2,
    }).format(monto);
  } catch {
    texto = `${moneda} ${monto.toLocaleString('es-AR')}`;
  }
  return `${texto} / ${periodo === 'anual' ? 'año' : 'mes'}`;
}

export function formatearFechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = parsearFecha(iso);
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(fecha);
}

export function formatearFechaLarga(iso: string): string {
  const fecha = parsearFecha(iso);
  if (!fecha) return iso;
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/** Escala de constancia: 0 sin desafíos, 3 con tres o más en el día. */
export type NivelActividad = 0 | 1 | 2 | 3;

export function nivelActividad(completadas: number): NivelActividad {
  if (!Number.isFinite(completadas) || completadas <= 0) return 0;
  if (completadas >= 3) return 3;
  return Math.floor(completadas) as 1 | 2;
}

export interface CeldaActividad {
  fecha: string;
  /** Presencia: abrió la app aunque no haya completado desafíos. */
  activa: boolean;
  completadas: number;
  nivel: NivelActividad;
  esHoy: boolean;
  /** Días futuros o previos a la ventana que no se pintan. */
  fuera: boolean;
}

export interface SemanaActividad {
  celdas: CeldaActividad[];
}

/** Semanas del mapa de constancia, contando la semana en curso. */
const SEMANAS_CONSTANCIA = 5;

/** Lunes con el que arranca el último mes que termina en `hasta`. */
export function inicioConstancia(hasta: string): string {
  const fin = parsearFecha(hasta);
  if (!fin) return hasta;
  const desplazamiento = (fin.getDay() + 6) % 7;
  return aIso(sumarDias(fin, -desplazamiento - (SEMANAS_CONSTANCIA - 1) * 7));
}

/** Semanas completas de lunes a domingo que cubren la ventana pedida. */
export function construirGrillaActividad(
  desde: string,
  hasta: string,
  actividad: string[],
  completadasPorDia: Record<string, number> = {},
): SemanaActividad[] {
  const inicio = parsearFecha(desde);
  const fin = parsearFecha(hasta);
  if (!inicio || !fin) return [];
  const activas = new Set(actividad);
  const primerLunes = sumarDias(inicio, -((inicio.getDay() + 6) % 7));
  const ultimoDomingo = sumarDias(fin, 6 - ((fin.getDay() + 6) % 7));

  const semanas: SemanaActividad[] = [];
  for (let lunes = primerLunes; lunes <= ultimoDomingo; lunes = sumarDias(lunes, 7)) {
    semanas.push({
      celdas: Array.from({ length: 7 }, (_, dia) => {
        const fecha = sumarDias(lunes, dia);
        const iso = aIso(fecha);
        const completadas = completadasPorDia[iso] ?? 0;
        return {
          fecha: iso,
          activa: activas.has(iso),
          completadas,
          nivel: nivelActividad(completadas),
          esHoy: iso === hasta,
          fuera: fecha < inicio || fecha > fin,
        };
      }),
    });
  }
  return semanas;
}

export function diasActivos(actividad: string[], desde: string, hasta: string): number {
  return new Set(
    actividad.filter((fecha) => fecha >= desde && fecha <= hasta),
  ).size;
}

export function desafiosCompletados(
  completadasPorDia: Record<string, number> | undefined,
  desde: string,
  hasta: string,
): number {
  return Object.entries(completadasPorDia ?? {}).reduce(
    (total, [fecha, cantidad]) =>
      total + (fecha >= desde && fecha <= hasta ? cantidad : 0),
    0,
  );
}

export interface HitoRacha {
  dias: number;
  valor: number;
}

export function proximoHitoDeRacha(
  racha: number,
  tramos: HitoRacha[] | undefined,
): { siguiente: HitoRacha | null; alcanzados: number; total: number } {
  const ordenados = [...(tramos ?? [])].sort((a, b) => a.dias - b.dias);
  const siguiente = ordenados.find((tramo) => racha < tramo.dias) ?? null;
  const alcanzados = ordenados.filter((tramo) => racha >= tramo.dias).length;
  return { siguiente, alcanzados, total: ordenados.length };
}

/** Progreso hacia el próximo hito, con el tramo anterior como piso. */
export function progresoDeRacha(
  racha: number,
  tramos: HitoRacha[] | undefined,
): { siguiente: HitoRacha | null; avance: number } {
  const ordenados = [...(tramos ?? [])].sort((a, b) => a.dias - b.dias);
  const siguiente = ordenados.find((tramo) => racha < tramo.dias) ?? null;
  const previo = [...ordenados].reverse().find((tramo) => racha >= tramo.dias) ?? null;
  const piso = previo?.dias ?? 0;
  const avance = siguiente
    ? Math.min(1, Math.max(0, (racha - piso) / Math.max(1, siguiente.dias - piso)))
    : 1;
  return { siguiente, avance };
}

export function medallasDeRendimiento(
  rendimiento: Record<string, RendimientoJuego> | undefined,
  juego: string,
): RendimientoJuego {
  return (
    rendimiento?.[juego] ?? {
      completadas: 0,
      mejor_tiempo_segundos: null,
      promedio_tiempo_segundos: null,
      ultima_fecha: null,
    }
  );
}

export function totalMedallasContadas(medallas: MedallasPorCalificacion): number {
  return CALIFICACIONES_CONTADAS.reduce(
    (total, calificacion) => total + medallas[calificacion],
    0,
  );
}

function totalContadoDelMes(
  juegos: Record<string, MedallasPorCalificacion> | undefined,
): number {
  return Object.values(juegos ?? {}).reduce(
    (total, medallas) => total + totalMedallasContadas(medallas),
    0,
  );
}

/** Demanda dominante de cada juego diario: un eje por juego, sin agrupar. */
export const EJES_PRACTICA = [
  { etiqueta: 'Deducción verbal', juego: 'wordle' },
  { etiqueta: 'Atención visual', juego: 'sopa_letras' },
  { etiqueta: 'Lógica', juego: 'sudoku' },
  { etiqueta: 'Vocabulario', juego: 'crucigrama' },
] as const;

export interface EjePractica {
  etiqueta: string;
  juego: string;
  total: number;
  /** Posición sobre el radio del radar, con la escala común del año. */
  fraccion: number;
}

export interface PracticaAnual {
  ejes: EjePractica[];
  total: number;
  record: number;
  escala: number;
}

/** Medallas del año por juego, con una escala común para comparar los ejes. */
export function practicaAnual(
  meses: MedallasMes[] | undefined,
  actual: string,
): PracticaAnual {
  const anio = actual.slice(0, 4);
  const bloques = (meses ?? []).filter((bloque) => bloque.mes.startsWith(`${anio}-`));
  const totales = EJES_PRACTICA.map((eje) => ({
    etiqueta: eje.etiqueta,
    juego: eje.juego,
    total: bloques.reduce(
      (suma, bloque) =>
        suma + totalMedallasContadas(bloque.juegos[eje.juego] ?? MEDALLAS_VACIAS),
      0,
    ),
  }));
  const total = totales.reduce((suma, eje) => suma + eje.total, 0);
  const record = Math.max(0, ...totales.map((eje) => eje.total));
  const escala = Math.max(5, Math.ceil((record * 1.22) / 5) * 5);
  return {
    ejes: totales.map((eje) => ({ ...eje, fraccion: eje.total / escala })),
    total,
    record,
    escala,
  };
}

/* Motivos de los consejos: una lectura breve del progreso atada a cada situación. */

export type MotivosConsejo = Partial<Record<SituacionConsejo, string>>;

const MEDALLAS_PARA_EJE = 8;
const VECES_PARA_DESEQUILIBRIO = 2;
const DIFERENCIA_PARA_MEJORA = 3;
const DIAS_MINIMOS_DE_RACHA = 3;

function nombreMes(mes: string): string {
  const [anio, numeroMes] = mes.split('-').map(Number);
  if (!anio || !numeroMes) return mes;
  return new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(
    new Date(anio, numeroMes - 1, 1),
  );
}

function totalDelMes(meses: MedallasMes[] | undefined, mes: string): number | null {
  const bloque = (meses ?? []).find((item) => item.mes === mes);
  return bloque ? totalContadoDelMes(bloque.juegos) : null;
}

function motivoEjeDesequilibrado(
  meses: MedallasMes[] | undefined,
  actual: string,
): string | undefined {
  const { ejes, total } = practicaAnual(meses, actual);
  if (total < MEDALLAS_PARA_EJE) return undefined;
  const orden = [...ejes].sort((a, b) => b.total - a.total);
  const maximo = orden[0];
  const minimo = orden[orden.length - 1];
  if (minimo.total === 0) return undefined;
  const veces = Math.floor(maximo.total / minimo.total);
  if (veces < VECES_PARA_DESEQUILIBRIO) return undefined;
  return `Este año practicaste ${maximo.etiqueta} ${veces}× más que ${minimo.etiqueta}.`;
}

/** El mes en curso es parcial: solo se compara cuando ya supera al anterior cerrado. */
function motivoMesEnMejora(
  meses: MedallasMes[] | undefined,
  actual: string,
): string | undefined {
  const previo = mesAnterior(actual);
  const totalActual = totalDelMes(meses, actual);
  const totalPrevio = totalDelMes(meses, previo);
  if (totalActual === null || totalPrevio === null || totalActual === 0) return undefined;
  const diferencia = totalActual - totalPrevio;
  if (diferencia < DIFERENCIA_PARA_MEJORA) return undefined;
  return `${nombreMes(actual).replace(/^./, (letra) => letra.toUpperCase())} suma ${totalActual} medallas: +${diferencia} respecto de ${nombreMes(previo)}.`;
}

function motivoRachaReanudada(
  actividad: string[],
  desde: string,
  hasta: string,
  racha: number,
): string | undefined {
  if (racha !== 1) return undefined;
  const presentes = new Set(actividad);
  if (!presentes.has(hasta)) return undefined;
  const previas = actividad.filter((fecha) => fecha < hasta).sort().reverse();
  const ultima = previas[0];
  if (!ultima) return undefined;
  const fin = parsearFecha(hasta);
  const corte = parsearFecha(ultima);
  if (!fin || !corte) return undefined;
  const diasSinJugar = Math.round((fin.getTime() - corte.getTime()) / 86_400_000);
  if (diasSinJugar < 1) return undefined;

  let previa = 0;
  let esperada = corte;
  for (const fecha of previas) {
    if (fecha !== aIso(esperada)) break;
    previa += 1;
    esperada = sumarDias(esperada, -1);
  }
  if (previa < DIAS_MINIMOS_DE_RACHA) return undefined;

  // Si la corrida llega al borde de la ventana, pudo empezar antes: no se afirma el total.
  const dias =
    aIso(sumarDias(esperada, 1)) === desde ? `más de ${previa}` : `${previa}`;
  return `Volviste después de ${diasSinJugar} días: tu racha anterior duró ${dias} días.`;
}

/** Texto para los consejos etiquetados, con los números reales del jugador. */
export function motivosDeConsejos(
  resumen: Pick<PerfilResumen, 'meses' | 'periodo' | 'actividad'>,
  racha: number,
): MotivosConsejo {
  const motivos: MotivosConsejo = {};
  const eje = motivoEjeDesequilibrado(resumen.meses, resumen.periodo.mes);
  if (eje) motivos.eje_desequilibrado = eje;
  const mes = motivoMesEnMejora(resumen.meses, resumen.periodo.mes);
  if (mes) motivos.mes_en_mejora = mes;
  const rachaTexto = motivoRachaReanudada(
    resumen.actividad,
    resumen.periodo.desde,
    resumen.periodo.hasta,
    racha,
  );
  if (rachaTexto) motivos.racha_reanudada = rachaTexto;
  return motivos;
}

export interface PuntoRadar {
  x: number;
  y: number;
}

const RADAR = { centroX: 160, centroY: 80, radio: 54 } as const;
const DIRECCIONES_RADAR = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
] as const;

/** Vértices del rombo de práctica: arriba, derecha, abajo e izquierda. */
export function puntosRadar(ejes: EjePractica[]): PuntoRadar[] {
  const redondear = (valor: number) => Math.round(valor * 10) / 10;
  return ejes.map((eje, indice) => {
    const direccion = DIRECCIONES_RADAR[indice % DIRECCIONES_RADAR.length];
    const radio = RADAR.radio * Math.min(1, eje.fraccion);
    return {
      x: redondear(RADAR.centroX + direccion.x * radio),
      y: redondear(RADAR.centroY + direccion.y * radio),
    };
  });
}

/** Días que faltan para cerrar el mes de `hasta`, incluido el último día. */
export function diasRestantesMes(hasta: string): number {
  const fecha = parsearFecha(hasta);
  if (!fecha) return 0;
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  return Math.max(0, ultimoDia - fecha.getDate());
}

export interface TramoMensaje {
  texto: string;
  /** Los valores que conviene leer de un vistazo se marcan en negrita. */
  fuerte?: boolean;
}

const MEDALLAS_PARA_TENDENCIA = 8;
const CUOTA_CONCENTRADA = 0.4;
const CUOTA_SECUNDARIA = 0.3;
const DIFERENCIA_PAREJA = 0.1;

function enumerar(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ni ${items[items.length - 1]}`;
}

/** Lectura de la distribución por eje, sin juicios de valor. */
export function mensajePractica(practica: PracticaAnual): TramoMensaje[] {
  const { ejes, total } = practica;
  if (total === 0) return [{ texto: 'Todavía no sumaste medallas este año.' }];
  if (total < MEDALLAS_PARA_TENDENCIA) {
    return [{ texto: 'Con pocas medallas todavía no hay una tendencia clara.' }];
  }
  const vacios = ejes.filter((eje) => eje.total === 0);
  if (vacios.length > 0) {
    return [
      { texto: 'Todavía no sumaste medallas en ' },
      { texto: enumerar(vacios.map((eje) => eje.etiqueta)), fuerte: true },
      { texto: '.' },
    ];
  }
  const orden = [...ejes].sort((a, b) => b.total - a.total);
  const primero = orden[0];
  const segundo = orden[1];
  const minimo = Math.min(...ejes.map((eje) => eje.total));
  const maximo = Math.max(...ejes.map((eje) => eje.total));
  if ((maximo - minimo) / total <= DIFERENCIA_PAREJA) {
    if (minimo === maximo) {
      return [
        { texto: 'Práctica pareja: ' },
        { texto: String(maximo), fuerte: true },
        { texto: ' medallas por demanda.' },
      ];
    }
    return [
      { texto: 'Práctica pareja: entre ' },
      { texto: String(minimo), fuerte: true },
      { texto: ' y ' },
      { texto: String(maximo), fuerte: true },
      { texto: ' medallas por demanda.' },
    ];
  }
  if (primero.total / total >= CUOTA_CONCENTRADA) {
    const partes: TramoMensaje[] = [
      { texto: 'Practicaste más ' },
      { texto: primero.etiqueta, fuerte: true },
      { texto: ': ' },
      { texto: String(primero.total), fuerte: true },
      { texto: ` de ${total} medallas.` },
    ];
    if (segundo.total / total >= CUOTA_SECUNDARIA) {
      partes.push(
        { texto: ' Después, ' },
        { texto: segundo.etiqueta, fuerte: true },
        { texto: ' con ' },
        { texto: String(segundo.total), fuerte: true },
        { texto: '.' },
      );
    }
    return partes;
  }
  return [
    { texto: 'Tus medallas se reparten entre ' },
    { texto: primero.etiqueta, fuerte: true },
    { texto: ' y ' },
    { texto: segundo.etiqueta, fuerte: true },
    { texto: '.' },
  ];
}

function tramoDiasRestantes(dias: number): TramoMensaje[] {
  return [
    { texto: ' Quedan ' },
    { texto: String(dias), fuerte: true },
    { texto: ' días para remontarlo.' },
  ];
}

/** Comparación del mes en curso contra el mes anterior, con días restantes. */
export function mensajeEvolucion(
  serie: SerieProgreso,
  hasta: string,
): TramoMensaje[] {
  const total = serie.totales[serie.totales.length - 1] ?? 0;
  const previo = serie.totales[serie.totales.length - 2] ?? 0;
  const mesActual = formatearMes(serie.ventana[serie.ventana.length - 1]).split(' de ')[0];
  const mesPrevio = formatearMes(serie.anterior).split(' de ')[0].toLowerCase();
  const dias = diasRestantesMes(hasta);

  if (total === 0 && previo === 0) {
    return [{ texto: `${mesActual} todavía no suma medallas; ${mesPrevio} tampoco.` }];
  }
  if (previo === 0) {
    return [
      { texto: `${mesActual} suma ` },
      { texto: String(total), fuerte: true },
      { texto: ` medallas; ${mesPrevio} cerró sin medallas.` },
    ];
  }
  if (total === 0) {
    return [
      { texto: `${mesActual} todavía no suma medallas; ${mesPrevio} cerró con ` },
      { texto: String(previo), fuerte: true },
      { texto: '.' },
      ...(dias > 0 ? tramoDiasRestantes(dias) : []),
    ];
  }

  const partes: TramoMensaje[] = [
    { texto: `${mesActual} ${total > previo ? 'suma' : 'lleva'} ` },
    { texto: String(total), fuerte: true },
    { texto: ` medallas; ${mesPrevio} cerró con ` },
    { texto: String(previo), fuerte: true },
    { texto: '.' },
  ];
  if (total < previo && dias > 0) partes.push(...tramoDiasRestantes(dias));
  return partes;
}

export function mesesVentana(mes: string, cantidad: number): string[] {
  const [anio, numero] = mes.split('-').map(Number);
  if (!anio || !numero) return [mes];
  const base = new Date(anio, numero - 1, 1);
  return Array.from({ length: cantidad }, (_, indice) => {
    const fecha = new Date(
      base.getFullYear(),
      base.getMonth() - (cantidad - 1 - indice),
      1,
    );
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  });
}

export function mesAnterior(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number);
  if (!anio || !numero) return mes;
  const fecha = new Date(anio, numero - 2, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function nombreMesCorto(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number);
  if (!anio || !numero) return mes;
  return new Intl.DateTimeFormat('es-AR', { month: 'short' })
    .format(new Date(anio, numero - 1, 1))
    .replace('.', '');
}

export interface PuntoProgreso {
  x: number;
  y: number;
  mes: string;
  total: number;
}

export interface SerieProgreso {
  ventana: string[];
  totales: number[];
  record: number;
  promedio: number;
  escala: number;
  puntos: PuntoProgreso[];
  totalAnio: number;
  anio: string;
  anterior: string;
  diferencia: number;
}

/** Serie de los últimos meses (S–C), con total del año y comparación mensual. */
export function construirProgreso(
  meses: MedallasMes[] | undefined,
  actual: string,
  cantidad = 6,
): SerieProgreso {
  const porMes = new Map((meses ?? []).map((bloque) => [bloque.mes, bloque.juegos]));
  const ventana = mesesVentana(actual, cantidad);
  const totales = ventana.map((mes) => totalContadoDelMes(porMes.get(mes)));
  const record = Math.max(0, ...totales);
  const promedio = Math.round(
    totales.reduce((suma, total) => suma + total, 0) / Math.max(1, totales.length),
  );
  const escala = Math.max(5, Math.ceil((record * 1.22) / 5) * 5);
  const anio = actual.slice(0, 4);
  const totalAnio = (meses ?? [])
    .filter((bloque) => bloque.mes.startsWith(`${anio}-`))
    .reduce((suma, bloque) => suma + totalContadoDelMes(bloque.juegos), 0);
  const puntos = ventana.map((mes, indice) => ({
    x: 6 + (indice * 88) / Math.max(1, ventana.length - 1),
    y: 100 - (totales[indice] / escala) * 100,
    mes,
    total: totales[indice],
  }));
  const anterior = mesAnterior(actual);
  const diferencia =
    totales[totales.length - 1] - (totales[totales.length - 2] ?? 0);

  return {
    ventana,
    totales,
    record,
    promedio,
    escala,
    puntos,
    totalAnio,
    anio,
    anterior,
    diferencia,
  };
}

/** Curva suave con puntos de control horizontales sobre la serie. */
export function curva(puntos: PuntoProgreso[]): string {
  return puntos.reduce((trazo, punto, indice) => {
    if (indice === 0) return `M ${punto.x} ${punto.y}`;
    const previo = puntos[indice - 1];
    const medio = (previo.x + punto.x) / 2;
    return `${trazo} C ${medio} ${previo.y} ${medio} ${punto.y} ${punto.x} ${punto.y}`;
  }, '');
}
