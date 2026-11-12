import { simularMovimiento } from '../../../../tests/helpers/movimiento';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../../../store/store';
import { reiniciarSeleccionNarrativa } from '../../../store/narrativoSelectionSlice';
import KingsCourt from './KingsCourt';

const { iniciar, estadoInicial } = vi.hoisted(() => ({ iniciar: vi.fn(), estadoInicial: vi.fn() }));
const date = '2026-11-12';

vi.mock('@ionic/react', () => ({ IonPage: ({ children }: any) => <div>{children}</div>, IonContent: ({ children }: any) => <div>{children}</div> }));
vi.mock('./narrativeService', async importOriginal => ({
  ...await importOriginal<typeof import('./narrativeService')>(),
  iniciarPartida: iniciar,
  obtenerCortePartida: async () => ({ corte: [] }),
  obtenerEstadoPartida: estadoInicial,
}));
vi.mock('./recursos/precargaNarrativa', () => ({
  CABALLO_CARGA: '',
  imagenesDelContenido: () => [],
  prepararCargaNarrativa: () => ({
    desconectar: () => {},
    promesa: Promise.resolve({
      universo_id: 'corte_medieval',
      tiene_partida_activa: false,
      atributos_iniciales: { oro: 50, pueblo: 50, ejercito: 50, fe: 50 },
      personajes_ofrecidos: [{ _id: 'p1', nombre: 'Ana' }, { _id: 'p2', nombre: 'Beto' }, { _id: 'p3', nombre: 'Caro' }],
      cartas_ofrecidas: [{ _id: 'c1', nombre: 'Una' }, { _id: 'c2', nombre: 'Dos' }, { _id: 'c3', nombre: 'Tres' }],
      eventos_del_dia: [],
    }),
  }),
}));
vi.mock('../../../services/assetPreloader', () => ({ imagenPrecargada: (src: string) => src, precargarImagenes: async () => {} }));
vi.mock('./COMPARTIDOS/CARGA_NARRATIVA/CargaNarrativa', () => ({ default: ({ onEntrar }: any) => <button onClick={onEntrar}>Entrar</button> }));
vi.mock('./COMPARTIDOS/FONDO_CORTE/FondoCorte', () => ({ default: () => null }));
vi.mock('./COMPARTIDOS/TRANSICION_NARRATIVA/TransicionNarrativa', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('./COMPARTIDOS/MAZO_UI/MazoUi', () => ({ default: () => null }));
vi.mock('./COMPARTIDOS/CONFIGURACION_EDAD/ConfiguracionEdad', () => ({ default: () => null }));
vi.mock('./ETAPA_0_MUESTRA_EVENTO/MuestraEventoEtapa0', () => ({ default: ({ onContinuar }: any) => <button onClick={onContinuar}>Comenzar</button> }));
vi.mock('./ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1', () => ({
  default: ({ titulo, cartas, onConfirmar }: any) => <div>{titulo}<button onClick={() => onConfirmar(cartas)}>Confirmar</button></div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  store.dispatch(reiniciarSeleccionNarrativa());
  simularMovimiento();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  estadoInicial.mockResolvedValue({});
  iniciar.mockResolvedValue({});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

const elegirCorteYCartas = async () => {
  render(<Provider store={store}><MemoryRouter initialEntries={[{ pathname: '/juegos/kings-court/jugar', state: { challenge: { dateKey: date } } }]}><KingsCourt /></MemoryRouter></Provider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Comenzar' }));
  await screen.findByText('Forma tu corte');
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await screen.findByText('Prepara el reino');
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await waitFor(() => expect(iniciar).toHaveBeenCalledTimes(1));
};

describe('dificultad informada al iniciar la partida', () => {
  it('envía el modo fácil cuando la edad activa la adaptación', async () => {
    localStorage.setItem('cognijuegos_edad', '60');
    await elegirCorteYCartas();
    expect(iniciar).toHaveBeenCalledWith(date, ['p1', 'p2', 'p3'], ['c1', 'c2', 'c3'], 'facil');
  });

  it('envía el modo normal cuando la edad no llega al umbral', async () => {
    localStorage.setItem('cognijuegos_edad', '30');
    await elegirCorteYCartas();
    expect(iniciar).toHaveBeenCalledWith(date, ['p1', 'p2', 'p3'], ['c1', 'c2', 'c3'], 'normal');
  });
});
