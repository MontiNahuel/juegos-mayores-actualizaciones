import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../../../store/store';
import { iniciarJugador } from '../../../store/narrativoSelectionSlice';
import KingsCourt from './KingsCourt';

const { continuar } = vi.hoisted(() => ({ continuar: vi.fn() }));
const date = '2026-11-06';
vi.mock('@ionic/react', () => ({ IonPage: ({ children }: any) => <div>{children}</div>, IonContent: ({ children }: any) => <div>{children}</div> }));
vi.mock('./narrativeService', async importOriginal => ({
  ...await importOriginal<typeof import('./narrativeService')>(),
  continuarTurno: continuar,
  obtenerCortePartida: async () => ({ corte: [] }),
  obtenerEstadoPartida: async () => ({ mes_actual: 2, fase_actual: 'BALANCE_MES', recursos: { oro: 50, ejercito: 50, pueblo: 50, fe: 50 }, resultado_actual: { titulo: 'Resultado mes 2', texto: 'La corte decidió.', efectos: [] } }),
}));
vi.mock('./recursos/precargaNarrativa', () => ({ CABALLO_CARGA: '', imagenesDelContenido: () => [], prepararCargaNarrativa: () => ({ desconectar: () => {}, promesa: Promise.resolve({ universo_id: 'corte', tiene_partida_activa: true, personajes_ofrecidos: [], cartas_ofrecidas: [] }) }) }));
vi.mock('../../../services/assetPreloader', () => ({ imagenPrecargada: (src: string) => src, precargarImagenes: async () => {} }));
vi.mock('./COMPARTIDOS/CARGA_NARRATIVA/CargaNarrativa', () => ({ default: ({ onEntrar }: any) => <button onClick={onEntrar}>Entrar</button> }));
vi.mock('./COMPARTIDOS/FONDO_CORTE/FondoCorte', () => ({ default: () => null }));
vi.mock('./COMPARTIDOS/TRANSICION_NARRATIVA/TransicionNarrativa', () => ({ default: ({ children }: any) => children }));
vi.mock('./COMPARTIDOS/MAZO_UI/MazoUi', () => ({ default: () => null }));
vi.mock('./COMPARTIDOS/CONFIGURACION_EDAD/ConfiguracionEdad', () => ({ default: () => null }));
vi.mock('./ETAPA_4_MOSTRAR_RESULTADO/MostrarResultadoEtapa4', () => ({ default: ({ resultado, onContinuar, continuando }: any) => <div>{resultado?.titulo}<button disabled={continuando} onClick={onContinuar}>{continuando ? 'Continuando...' : 'Continuar'}</button></div> }));
vi.mock('./ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1', () => ({ default: ({ titulo, cartas }: any) => <div>{titulo}{cartas.map((c: any) => <span key={c.id}>{c.nombre}</span>)}</div> }));

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear();
  store.dispatch(iniciarJugador({ date, mes_actual: 2, recursos: { oro: 50, ejercito: 50, pueblo: 50, fe: 50 } }));
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

it('un rechazo al continuar conserva el resultado y el mes; reintentar aplica solo el mes confirmado', async () => {
  let rechazar!: (error: Error) => void;
  continuar.mockImplementationOnce(() => new Promise((_, reject) => { rechazar = reject; }));
  render(<Provider store={store}><MemoryRouter initialEntries={[{ pathname: '/juegos/kings-court/jugar', state: { challenge: { dateKey: date } } }]}><KingsCourt /></MemoryRouter></Provider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }));
  await screen.findByText('Resultado mes 2');
  const button = screen.getByRole('button', { name: 'Continuar' });
  fireEvent.click(button); fireEvent.click(button);
  expect(continuar).toHaveBeenCalledTimes(1);
  expect(store.getState().narrativoSelection.jugador.mes_actual).toBe(2);
  expect(screen.getByText('Resultado mes 2')).toBeInTheDocument();
  await act(async () => { rechazar(new Error('La partida no se encuentra en fase de balance mensual.')); });
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudo continuar');
  expect(store.getState().narrativoSelection.jugador.mes_actual).toBe(2);
  expect(screen.getByText('Resultado mes 2')).toBeInTheDocument();
  continuar.mockResolvedValueOnce({ mes_actual: 3, fase_actual: 'DRAFT_MENSUAL', cartas_draft_actual: [{ _id: 'carta_nueva', nombre: 'Nueva carta' }] });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await waitFor(() => expect(screen.getByText('Nueva carta')).toBeInTheDocument());
  expect(store.getState().narrativoSelection.jugador.mes_actual).toBe(3);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
