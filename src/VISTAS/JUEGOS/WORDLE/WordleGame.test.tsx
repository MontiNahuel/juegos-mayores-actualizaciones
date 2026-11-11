import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import WordleGame from './WordleGame';
import { getActiveProgressStorageKey } from '../attemptsService';

vi.mock('../../../context/PlayerEconomyContext', () => ({
  usePlayerEconomy: () => ({
    puntos: 0,
    puntosPorCalificacion: { S: 100, A: 90, B: 75, C: 50, F: 0 },
    escalasTiempoPorJuego: {},
    abrirComprarPista: vi.fn(),
  }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, score: 0, stars: 0, grade: 'F' }))));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('muestra 6 filas de tablero y limita a 6 intentos terminando en derrota si no se acierta', async () => {
  const challenge = {
    dateKey: '2026-11-06',
    dateStr: 'Viernes 6 de noviembre',
    day: 6,
    word: 'PLAZA',
    hints: ['Espacio público', 'Empieza con P'],
  };

  render(
    <MemoryRouter initialEntries={[{ pathname: '/juegos/wordle/jugar', state: { challenge } }]}>
      <WordleGame />
    </MemoryRouter>
  );

  // Esperar a que restoreProgress termine y el juego esté listo
  await waitFor(() => {
    const hintBtn = screen.getByLabelText('Pedir una pista');
    expect(hintBtn.hasAttribute('disabled')).toBe(false);
  });

  // Ingresar 6 palabras incorrectas (5 letras cada una)
  const incorrectWords = ['CASAS', 'MESAS', 'PERRO', 'GATOS', 'LUCES', 'MONTE'];
  for (let i = 0; i < incorrectWords.length; i++) {
    const word = incorrectWords[i];
    for (const char of word) {
      fireEvent.keyDown(window, { key: char });
    }
    fireEvent.keyDown(window, { key: 'Enter' });
  }

  // Comprobar que tras el intento 6 se agotan los intentos y se marca la derrota
  await waitFor(() => {
    expect(screen.getByText((content) => content.includes('Intentos:') && content.includes('6 / 6'))).toBeTruthy();
  }, { timeout: 3000 });
  expect(screen.getByText('¡Se agotaron los intentos!')).toBeTruthy();

  // El CompletedModal debe mostrar el título de derrota para Wordle después del timeout
  await waitFor(() => {
    expect(screen.getByText('¡Buen intento!')).toBeTruthy();
  }, { timeout: 3000 });

  // NO debe revelar la palabra secreta para evitar spoilers al reiniciar
  expect(screen.queryByText('PLAZA')).toBeNull();
  expect(screen.queryByText('La palabra era')).toBeNull();

  // NO debe figurar el tiempo al perder
  expect(screen.queryByText('Tiempo')).toBeNull();

  // El botón "Intentar de nuevo" debe estar disponible
  const restartBtn = screen.getByText('Intentar de nuevo');
  expect(restartBtn).toBeTruthy();

  // El progreso guardado en localStorage debe reflejar status: 'lost' y 6 intentos
  const storageKey = getActiveProgressStorageKey('wordle', '2026-11-06');
  const saved = JSON.parse(localStorage.getItem(storageKey)!);
  expect(saved.status).toBe('lost');
  expect(saved.attempts).toBe(6);

  // Al presionar "Intentar de nuevo", se reinicia el juego y la cuenta de intentos
  fireEvent.click(restartBtn);
  await waitFor(() => {
    expect(screen.getByText((content) => content.includes('Intentos:') && content.includes('0 / 6'))).toBeTruthy();
  });
});

it('permite ganar en un intento menor o igual a 6 y registra la victoria', async () => {
  const challenge = {
    dateKey: '2026-11-07',
    dateStr: 'Sábado 7 de noviembre',
    day: 7,
    word: 'CIELO',
    hints: ['Arriba', 'Azul'],
  };

  render(
    <MemoryRouter initialEntries={[{ pathname: '/juegos/wordle/jugar', state: { challenge } }]}>
      <WordleGame />
    </MemoryRouter>
  );

  await waitFor(() => {
    const hintBtn = screen.getByLabelText('Pedir una pista');
    expect(hintBtn.hasAttribute('disabled')).toBe(false);
  });

  // Ingresar 1 palabra incorrecta y luego la correcta
  for (const char of 'CASAS') fireEvent.keyDown(window, { key: char });
  fireEvent.keyDown(window, { key: 'Enter' });

  for (const char of 'CIELO') fireEvent.keyDown(window, { key: char });
  fireEvent.keyDown(window, { key: 'Enter' });

  await waitFor(() => {
    expect(screen.getByText((content) => content.includes('Intentos:') && content.includes('2 / 6'))).toBeTruthy();
  });

  await waitFor(() => {
    expect(screen.getByText('¡Palabra descubierta!')).toBeTruthy();
  }, { timeout: 3000 });

  const storageKey = getActiveProgressStorageKey('wordle', '2026-11-07');
  const saved = JSON.parse(localStorage.getItem(storageKey)!);
  expect(saved.status).toBe('won');
  expect(saved.attempts).toBe(2);
});


it('rechaza palabras inexistentes como AAAAA sin consumir intentos y conserva las letras para corregir', async () => {
  const challenge = {
    dateKey: '2026-11-08',
    dateStr: 'Domingo 8 de noviembre',
    day: 8,
    word: 'CIELO',
    hints: ['Arriba', 'Azul'],
  };

  render(
    <MemoryRouter initialEntries={[{ pathname: '/juegos/wordle/jugar', state: { challenge } }]}>
      <WordleGame />
    </MemoryRouter>
  );

  await waitFor(() => {
    const hintBtn = screen.getByLabelText('Pedir una pista');
    expect(hintBtn.hasAttribute('disabled')).toBe(false);
  });

  // Escribir una palabra inexistente (AAAAA)
  for (const char of 'AAAAA') fireEvent.keyDown(window, { key: char });

  // Debe mostrar aviso en la cabecera y marcar el botón ENVIAR como deshabilitado visualmente
  expect(screen.getByRole('alert').textContent).toContain('Esa palabra no existe. Intentá con otra.');
  const enviarBtn = screen.getByRole('button', { name: 'ENVIAR' });
  expect(enviarBtn.getAttribute('aria-disabled')).toBe('true');

  // Intentar enviar con Enter o clic no debe sumar intentos
  fireEvent.keyDown(window, { key: 'Enter' });
  expect(screen.getByText((c) => c.includes('Intentos:') && c.includes('0 / 6'))).toBeTruthy();

  // Conserva las 5 letras en pantalla para permitir corregir con Backspace
  expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(5);

  // Borrar las 5 letras e ingresar la solución válida
  for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'Backspace' });
  expect(screen.queryByRole('alert')).toBeNull();

  for (const char of 'CIELO') fireEvent.keyDown(window, { key: char });
  fireEvent.keyDown(window, { key: 'Enter' });

  await waitFor(() => {
    expect(screen.getByText((c) => c.includes('Intentos:') && c.includes('1 / 6'))).toBeTruthy();
  });
});