import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerEconomyProvider } from '../../../context/PlayerEconomyContext';
import { store } from '../../../store/store';
import { Provider } from 'react-redux';
import KingsCourtCalendar from './KingsCourtCalendar';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/session')) {
        return new Response(JSON.stringify({ success: true, authenticated: false, user: null, racha: 0 }));
      }
      if (url.includes('/api/challenges/today')) {
        return new Response(
          JSON.stringify({
            id: 'c1',
            game_id: 'narrativo',
            date: '2026-11-12',
            difficulty: 'normal',
            title: 'Desafío Real - 2026-11-12',
            config: {},
            is_today: true,
            is_past: false,
            is_future: false,
          })
        );
      }
      if (url.includes('/api/challenges/month')) {
        return new Response(JSON.stringify({ year: 2026, month: 11, days_in_month: 30, total_challenges: 30, challenges: [] }));
      }
      if (url.includes('/api/challenges/range')) {
        return new Response(JSON.stringify({ game_id: 'narrativo', min_date: '2026-10-01', max_date: '2026-12-31' }));
      }
      return new Response('{}');
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calendario de King's Court", () => {
  it('consulta /api/challenges/today y /month usando difficulty=normal', async () => {
    render(
      <Provider store={store}>
        <PlayerEconomyProvider>
          <MemoryRouter>
            <KingsCourtCalendar />
          </MemoryRouter>
        </PlayerEconomyProvider>
      </Provider>
    );

    await waitFor(() => {
      const urls = vi.mocked(fetch).mock.calls.map(([input]) => String(input));
      expect(urls.some((u) => u.includes('/api/challenges/today') && u.includes('game_id=narrativo') && u.includes('difficulty=normal'))).toBe(true);
      expect(urls.some((u) => u.includes('/api/challenges/month') && u.includes('game_id=narrativo') && u.includes('difficulty=normal'))).toBe(true);
    });
  });
});
