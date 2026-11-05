import { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AnimatedPointsBadge } from './AnimatedPointsBadge';

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const advance = (time: number) => act(() => {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach(callback => callback(time));
});

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => { frames.delete(id); }));
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('incrementa el saldo anterior al confirmado y termina exactamente en 800 ms', () => {
  render(<StrictMode><AnimatedPointsBadge points={150} earned={50} /></StrictMode>);
  expect(screen.getByText('100')).toBeTruthy();
  advance(0);
  advance(400);
  const displayed = Number(screen.getByText(/^\d+$/).textContent);
  expect(displayed).toBeGreaterThan(100);
  expect(displayed).toBeLessThan(150);
  advance(800);
  expect(screen.getByText('150')).toBeTruthy();
  expect(frames.size).toBe(0);
});

it('anima aunque la acreditación llegue después del saldo y no repite al gastar', () => {
  const { rerender } = render(<AnimatedPointsBadge points={150} />);
  expect(frames.size).toBe(0);
  rerender(<AnimatedPointsBadge points={150} earned={50} />);
  expect(screen.getByText('100')).toBeTruthy();
  advance(0); advance(800);
  rerender(<AnimatedPointsBadge points={70} earned={50} />);
  expect(screen.getByText('70')).toBeTruthy();
  expect(frames.size).toBe(0);
});

it('muestra el total directamente con movimiento reducido', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(<AnimatedPointsBadge points={150} earned={50} />);
  expect(screen.getByText('150')).toBeTruthy();
  expect(frames.size).toBe(0);
});

it('cancela el cuadro pendiente al desmontar', () => {
  const { unmount } = render(<AnimatedPointsBadge points={150} earned={50} />);
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
});
