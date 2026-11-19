/* Reúne los ajustes de legibilidad por edad para la interfaz narrativa. */
// Ajustes de tamaño para la presentación narrativa.
export const ADAPTACION_EDAD_HABILITADA = import.meta.env.VITE_ADAPTACION_EDAD !== 'false';
export const REGLAS_EDAD = {
  edadMayor: 45,
  edadMinima: 6,
  edadMaxima: 100,
  textoMinimo: 18,
  textoMaximo: 22,
  controlMinimo: 52,
  controlMaximo: 60,
  // El retrato conserva su tamanio: solo permitimos que el dialogo cubra hasta el 40%.
  personajeVisibleNormal: .7,
  personajeVisibleMayor: .6,
  storageKey: 'cognijuegos_edad',
};

// Devuelve una sola configuracion. La UI consume estas variables sin repetir edades ni tamanios.
export const configuracionPorEdad = (edad: number | null) => {
  const adaptado = ADAPTACION_EDAD_HABILITADA && edad !== null && edad >= REGLAS_EDAD.edadMayor;
  const progreso = adaptado ? Math.min(1, (edad - REGLAS_EDAD.edadMayor) / (REGLAS_EDAD.edadMaxima - REGLAS_EDAD.edadMayor)) : 0;
  // Calcula un valor intermedio para que el ajuste entre edades sea gradual.
  const interpolar = (inicio: number, fin: number) => inicio + (fin - inicio) * progreso;

  return {
    adaptado,
    tamanioTexto: interpolar(REGLAS_EDAD.textoMinimo, REGLAS_EDAD.textoMaximo),
    altoControl: interpolar(REGLAS_EDAD.controlMinimo, REGLAS_EDAD.controlMaximo),
    fraccionVisiblePersonaje: adaptado ? REGLAS_EDAD.personajeVisibleMayor : REGLAS_EDAD.personajeVisibleNormal,
  };
};

// Lee edad con los datos de este paso.
export const leerEdad = () => {
  if (!ADAPTACION_EDAD_HABILITADA || typeof window === 'undefined') return null;
  const valor = Number(localStorage.getItem(REGLAS_EDAD.storageKey));
  return valor >= REGLAS_EDAD.edadMinima && valor <= REGLAS_EDAD.edadMaxima ? valor : null;
};

// Guarda edad con los datos de este paso.
export const guardarEdad = (edad: number) => localStorage.setItem(REGLAS_EDAD.storageKey, String(edad));
