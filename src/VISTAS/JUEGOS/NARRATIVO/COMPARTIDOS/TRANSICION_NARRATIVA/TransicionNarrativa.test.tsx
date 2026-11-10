import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import TransicionNarrativa from './TransicionNarrativa';
import { simularMovimiento } from '../../../../../../tests/helpers/movimiento';

beforeEach(() => { simularMovimiento(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const escena = (id: string, texto = id) => <TransicionNarrativa etapa={id}><main><img src={`/${id}.png`} alt="" />{texto}</main></TransicionNarrativa>;

it('retiene la escena real con imágenes y monta sólo el último destino después de su salida', () => {
  const { rerender } = render(escena('a'));
  const anterior = screen.getByRole('main');
  rerender(escena('b'));
  expect(screen.getByRole('main')).toBe(anterior);
  expect(anterior.inert).toBe(true);
  expect(screen.queryByText('b')).toBeNull();
  rerender(escena('c'));
  const salida = gsap.getTweensOf(anterior)[0];
  act(() => { salida.progress(.5); });
  expect(Number(anterior.style.opacity)).toBeGreaterThan(0);
  act(() => { salida.progress(1); });
  expect(screen.getByText('c')).toBeTruthy();
  expect(anterior.isConnected).toBe(false);
});

it('un nodo del mismo grafo actualiza el contenido sin salida ni remontaje', () => {
  const { rerender } = render(escena('grafo', 'primero'));
  const anterior = screen.getByRole('main');
  rerender(escena('grafo', 'segundo'));
  expect(screen.getByRole('main')).toBe(anterior);
  expect(screen.getByText('segundo')).toBeTruthy();
  expect(gsap.getTweensOf(anterior)).toHaveLength(0);
});

it('desmontar durante la salida cancela su callback', () => {
  const { rerender, unmount } = render(escena('a'));
  const anterior = screen.getByRole('main');
  rerender(escena('b'));
  unmount();
  expect(gsap.getTweensOf(anterior)).toHaveLength(0);
});

it('movimiento reducido confirma varios cambios consecutivos sin bloquearse', () => {
  simularMovimiento()(true);
  const { rerender } = render(escena('a'));
  rerender(escena('b'));
  expect(screen.getByText('b')).toBeTruthy();
  rerender(escena('c'));
  expect(screen.getByText('c')).toBeTruthy();
});

it('volver al origen durante la salida restaura opacidad e interacción', () => {
  const { rerender } = render(escena('a'));
  const anterior = screen.getByRole('main');
  rerender(escena('b'));
  rerender(escena('a'));
  act(() => { gsap.getTweensOf(anterior)[0].progress(1); });
  expect(screen.getByRole('main')).toBe(anterior);
  expect(anterior.inert).toBe(false);
  expect(anterior.style.opacity).toBe('');
});
