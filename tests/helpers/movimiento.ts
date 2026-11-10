import { act, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import gsap from 'gsap';

// MediaQueryList controlable para comprobar cambios de preferencia durante un fundido.
export function simularMovimiento() {
  let reducido = false;
  const consultas = new Map<string, { media: string; readonly matches: boolean; addListener: (fn: () => void) => void; removeListener: (fn: () => void) => void; addEventListener: (_tipo: string, fn: () => void) => void; removeEventListener: (_tipo: string, fn: () => void) => void }>();
  const oyentes = new Set<() => void>();
  vi.stubGlobal('matchMedia', (media: string) => {
    if (!consultas.has(media)) consultas.set(media, {
      media,
      get matches() { return media === 'all' || (media === '(prefers-reduced-motion: reduce)' && reducido); },
      addListener: fn => { oyentes.add(fn); },
      removeListener: fn => { oyentes.delete(fn); },
      addEventListener: (_tipo, fn) => { oyentes.add(fn); },
      removeEventListener: (_tipo, fn) => { oyentes.delete(fn); },
    });
    return consultas.get(media);
  });
  return (valor: boolean) => {
    reducido = valor;
    oyentes.forEach(fn => fn());
    gsap.matchMediaRefresh();
  };
}

// Adelanta sólo el fundido que pertenece a esta imagen; no usa tiempos de pared.
export function terminarFondo(imagen: Element) {
  act(() => { gsap.getTweensOf(imagen).forEach(tween => tween.progress(1)); });
}

// Simula la llegada de los recursos de la escena antes de interactuar con el panel.
export function prepararLectura(contenedor: HTMLElement) {
  const marco = contenedor.querySelector('.titulo-narrativo__arte img');
  if (marco) fireEvent.load(marco);
  const fondo = contenedor.querySelector('.conversacion-fondo');
  if (fondo) { fireEvent.load(fondo); terminarFondo(fondo); }
  act(() => {
    gsap.globalTimeline.getChildren().filter(animacion => String(animacion.data || '').startsWith('conversacion:'))
      .forEach(animacion => animacion.progress(1));
  });
  terminarOpciones(contenedor);
}

// Las opciones se montan después del callback de lectura, en otro commit React.
export function terminarOpciones(contenedor: HTMLElement) {
  act(() => {
    gsap.getTweensOf([...contenedor.querySelectorAll('.dialogo-narrativo__opciones > button')])
      .forEach(tween => tween.progress(1));
  });
}
