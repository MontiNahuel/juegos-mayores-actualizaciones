import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { CompletedModal } from './CompletedModal';
import { getCalendarMonthData } from '../CALENDAR/calendarService';
import type { DayChallenge } from '../CALENDAR/types';

const economy = vi.hoisted(() => ({
  puntos: 100, costoDesbloqueoDiaPuntos: 30,
  isDiaDesbloqueado: vi.fn(), desbloquearDia: vi.fn(),
}));
vi.mock('../../../context/PlayerEconomyContext', () => ({ usePlayerEconomy: () => economy }));
vi.mock('../CALENDAR/calendarService', () => ({ getCalendarMonthData: vi.fn() }));
vi.mock('../../JUEGOS/useClassicChallenge', () => ({ useClassicChallenge: () => ({ completion: {} }) }));
vi.mock('../ANIMATIONS/SuccessFireworks', () => ({ SuccessFireworks: () => null }));

const previous: DayChallenge = { day: 31, dateKey: '2026-10-31', dateStr: '31 de Octubre', dayName: 'Sábado', config: { solution: 'HOGAR' }, status: 'pending' };
function Destination() {
  const location = useLocation();
  return <output data-testid="destination">{JSON.stringify({ path: location.pathname, state: location.state })}</output>;
}
function renderResult(gameId: 'wordle' | 'sudoku' | 'sopa_letras' | 'crucigrama' = 'wordle') {
  const close = vi.fn();
  render(<MemoryRouter><CompletedModal gameId={gameId} continuationDateKey="2026-11-01" onClose={close} /><Destination /></MemoryRouter>);
  return close;
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('token', 'test');
  economy.puntos = 100;
  economy.isDiaDesbloqueado.mockReturnValue(true);
  economy.desbloquearDia.mockResolvedValue({ success: true });
  vi.mocked(getCalendarMonthData).mockResolvedValue({ challenges: [previous] } as Awaited<ReturnType<typeof getCalendarMonthData>>);
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

it('integra las acciones en el resultado y busca el día anterior entre meses', async () => {
  const close = renderResult();
  await screen.findByRole('button', { name: 'Resolver el día anterior' });
  expect(screen.getByRole('heading', { name: '¡Palabra descubierta!' })).toBeTruthy();
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.queryByText('¿Seguimos jugando?')).toBeNull();
  expect(getCalendarMonthData).toHaveBeenCalledWith('wordle', 2026, 10, undefined, 'standard');
  fireEvent.click(screen.getByRole('button', { name: 'Volver al calendario' }));
  expect(close).toHaveBeenCalledOnce();
});

it.each(['wordle', 'sudoku', 'sopa_letras', 'crucigrama'] as const)('continúa %s mediante su calendario sin comprar si tiene acceso', async gameId => {
  renderResult(gameId);
  fireEvent.click(await screen.findByRole('button', { name: 'Resolver el día anterior' }));
  const destination = JSON.parse(screen.getByTestId('destination').textContent!);
  expect(destination.path).toBe(`/juegos/${gameId === 'sopa_letras' ? 'sopa-letras' : gameId}`);
  expect(destination.state.continueChallenge).toEqual(previous);
  expect(economy.desbloquearDia).not.toHaveBeenCalled();
});

it('compra desde el resultado y continúa únicamente después de confirmar el desbloqueo', async () => {
  economy.isDiaDesbloqueado.mockReturnValue(false);
  let resolve!: (value: { success: boolean }) => void;
  economy.desbloquearDia.mockReturnValue(new Promise(done => { resolve = done; }));
  renderResult();
  fireEvent.click(await screen.findByRole('button', { name: /Desbloquear día anterior/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Desbloquear y jugar por 30 pts' }));
  expect(economy.desbloquearDia).toHaveBeenCalledWith('wordle', '2026-10-31');
  expect(screen.getByRole('heading', { name: '¡Palabra descubierta!' })).toBeTruthy();
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Desbloqueando...' })).toBeDisabled();
  expect(JSON.parse(screen.getByTestId('destination').textContent!).path).toBe('/');
  resolve({ success: true });
  await waitFor(() => expect(JSON.parse(screen.getByTestId('destination').textContent!).path).toBe('/juegos/wordle'));
});

it('muestra el error de compra y permite reintentar sin salir del resultado', async () => {
  economy.isDiaDesbloqueado.mockReturnValue(false);
  economy.desbloquearDia.mockResolvedValue({ success: false, message: 'Sin conexión' });
  renderResult();
  fireEvent.click(await screen.findByRole('button', { name: /Desbloquear día anterior/ }));
  fireEvent.click(screen.getByRole('button', { name: /Desbloquear y jugar/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(JSON.parse(screen.getByTestId('destination').textContent!).path).toBe('/');
});

it('no ofrece comprar un día ya completado', async () => {
  vi.mocked(getCalendarMonthData).mockResolvedValue({ challenges: [{ ...previous, status: 'completed' }] } as Awaited<ReturnType<typeof getCalendarMonthData>>);
  renderResult();
  await screen.findByText(/Ya completaste/);
  expect(screen.queryByRole('button', { name: /Resolver|Desbloquear/ })).toBeNull();
  expect(economy.desbloquearDia).not.toHaveBeenCalled();
});

it('evita compras sin saldo suficiente', async () => {
  economy.puntos = 10;
  economy.isDiaDesbloqueado.mockReturnValue(false);
  renderResult();
  fireEvent.click(await screen.findByRole('button', { name: /Desbloquear día anterior/ }));
  expect(screen.getByText(/Te faltan 20 puntos/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Desbloquear y jugar/ })).toBeNull();
});

it('pide iniciar sesión a invitados antes de comprar', async () => {
  localStorage.clear();
  economy.isDiaDesbloqueado.mockReturnValue(false);
  renderResult();
  fireEvent.click(await screen.findByRole('button', { name: /Desbloquear día anterior/ }));
  expect(screen.getByRole('button', { name: 'Iniciar sesión / Registrarse' })).toBeTruthy();
  expect(economy.desbloquearDia).not.toHaveBeenCalled();
});

it('no ofrece comprar un día sin desafío publicado', async () => {
  vi.mocked(getCalendarMonthData).mockResolvedValue({ challenges: [{ ...previous, config: undefined }] } as Awaited<ReturnType<typeof getCalendarMonthData>>);
  renderResult();
  await screen.findByText('No hay un desafío disponible para el día anterior.');
  expect(screen.queryByRole('button', { name: /Resolver|Desbloquear/ })).toBeNull();
});
