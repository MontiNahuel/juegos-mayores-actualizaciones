/* Ajusta el trabajo de Pixi cuando la aplicación pasa a segundo plano. */
import { Application, type ApplicationOptions } from 'pixi.js';

/**
 * Configuración estándar optimizada para PixiJS en dispositivos móviles
 * orientada a adultos mayores (bajo consumo de batería, sin sobrecarga térmica).
 */
export const PIXI_MOBILE_LOW_POWER_CONFIG: Partial<ApplicationOptions> = {
  // Limita el DPR a 1.5 en pantallas móviles de alta densidad (3x, 4x)
  // evitando procesar millones de fragmentos innecesarios en la GPU.
  resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5),
  autoDensity: true,
  // Solicita al driver del dispositivo móvil priorizar la eficiencia energética
  powerPreference: 'low-power',
  // Desactiva el antialiasing pesado en assets 2D ya preescalados
  antialias: false,
  backgroundAlpha: 0,
};

/**
 * Registra listeners del ciclo de vida para congelar el renderizado
 * y las animaciones cuando la pestaña pasa a segundo plano o se bloquea la pantalla.
 */
export function configurarGestionSegundoPlano(
  app: Application,
  onPausar?: () => void,
  onReanudar?: () => void
): () => void {
  if (typeof document === 'undefined') return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {};

  // Pausa o reactiva el trabajo visual según la visibilidad.
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Congelar de inmediato para 0% uso de CPU/GPU y 0 datos en segundo plano
      app.stop();
      onPausar?.();
    } else {
      onReanudar?.();
      app.render();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
