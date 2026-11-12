import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import ImagenRetrato from './ImagenRetrato';
import { simularMovimiento } from '../../../../../tests/helpers/movimiento';
beforeEach(() => { simularMovimiento(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('conserva el retrato anterior hasta cargar y fundir el nuevo personaje', () => {
  const { rerender } = render(<ImagenRetrato src="/a.png" nombre="A" />);
  const anterior = screen.getByAltText('A');
  rerender(<ImagenRetrato src="/b.png" nombre="B" />);
  expect(anterior.isConnected).toBe(true);
  expect(anterior).toHaveStyle({ opacity: '1' });
  const siguiente = screen.getByAltText('B');
  expect(siguiente).toHaveStyle({ opacity: '0' });
  fireEvent.load(siguiente);
  act(() => { gsap.getTweensOf(siguiente)[0].progress(.5); });
  expect(Number((anterior as HTMLElement).style.opacity)).toBeGreaterThan(0);
  act(() => { gsap.getTweensOf(siguiente)[0].progress(1); });
  expect(anterior.isConnected).toBe(false);
  expect(siguiente).toHaveStyle({ opacity: '1' });
});

it('interrumpir el fundido conserva las capas visibles hasta completar el último destino', () => {
  const { rerender, container } = render(<ImagenRetrato src="/a.png" nombre="A" />);
  rerender(<ImagenRetrato src="/b.png" nombre="B" />);
  fireEvent.load(screen.getByAltText('B'));
  act(() => { gsap.getTweensOf(screen.getByAltText('B'))[0].progress(.4); });
  rerender(<ImagenRetrato src="/c.png" nombre="C" />);
  expect(container.querySelectorAll('img')).toHaveLength(3);
  fireEvent.load(screen.getByAltText('C'));
  act(() => { gsap.getTweensOf(screen.getByAltText('C'))[0].progress(1); });
  expect(container.querySelectorAll('img')).toHaveLength(1);
  expect(screen.getByAltText('C')).toHaveStyle({ opacity: '1' });
});
