import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import { simularMovimiento } from '../../../../../tests/helpers/movimiento';
import ResolverEventoEtapa2 from './DecidirEventoEtapa2';

const fondoBase = { src: '/fondo.png', personajes: [], oro: [], manos: [] };
const evento = {
  id: 'evento', titulo: 'La cosecha', descripcion: 'El pueblo espera una respuesta.', imagen: '',
  opciones: [{ id: 'ayudar', texto: 'Ayudar', bloqueada: false }],
};

beforeEach(() => { simularMovimiento(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('revela el evento con la animación compartida y habilita la decisión al terminar', () => {
  const elegir = vi.fn();
  const { container } = render(<ResolverEventoEtapa2 evento={evento} atributos={{}} fondoBase={fondoBase} onElegir={elegir} />);
  const escritura = gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:escritura')!;
  expect(escritura).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Ayudar' })).not.toBeInTheDocument();
  fireEvent.click(container.querySelector('.dialogo-narrativo__progresivo')!);
  expect(escritura.timeScale()).toBe(4);
  act(() => { escritura.progress(1); });
  fireEvent.click(screen.getByRole('button', { name: 'Ayudar' }));
  expect(elegir).toHaveBeenCalledExactlyOnceWith('ayudar');
});

it('presenta la escena una vez y conserva la entrada al avanzar dentro del mismo evento', () => {
  const { container, rerender } = render(<ResolverEventoEtapa2 evento={evento} atributos={{}} fondoBase={fondoBase} onElegir={vi.fn()} />);
  const escena = container.querySelector<HTMLElement>('.evento-escena')!;
  const entrada = gsap.getTweensOf(escena).find(t => t.data === 'evento:entrada')!;
  expect(entrada).toBeTruthy();
  act(() => { entrada.progress(.5); });
  expect(Number(escena.style.opacity)).toBeGreaterThan(0);
  expect(Number(escena.style.opacity)).toBeLessThan(1);
  rerender(<ResolverEventoEtapa2 evento={{ ...evento, nodo_id: 'anidado', descripcion: 'Otra condición.' }} atributos={{}} fondoBase={fondoBase} onElegir={vi.fn()} />);
  expect(gsap.getTweensOf(escena).find(t => t.data === 'evento:entrada')).toBe(entrada);
  act(() => { entrada.progress(1); });
  expect(Number(escena.style.opacity)).toBe(1);
});
