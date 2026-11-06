import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCourtPreview } from './courtPreviewService';

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('court preview API', () => {
  it('requests setup read-only and samples three distinct images across offered cards', async () => {
    const offered = Array.from({ length: 6 }, (_, i) => ({ _id: String(i), imagen: `/cards/${i}.webp` }));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cartas_ofrecidas: offered.slice(0, 3), personajes_ofrecidos: offered.slice(3) }) });
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;
    const cards = await loadCourtPreview('2026-11-06', signal);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map(card => card.image)).size).toBe(3);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain('/partida/setup?date=2026-11-06');
    expect(fetchMock.mock.calls[0][1]).toEqual({ signal, headers: {} });
  });

  it('ignores missing, duplicate and non-image protocol URLs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cartas_ofrecidas: [
      { _id: 'a', imagen: '/a.webp' }, { _id: 'b', imagen: '/a.webp' },
      { _id: 'c', imagen: '' }, { _id: 'd', imagen: 'javascript:alert(1)' },
    ] }) }));
    expect(await loadCourtPreview('2026-11-06', new AbortController().signal)).toEqual([{ id: 'a', image: '/a.webp' }]);
  });

  it('surfaces API failure without invoking any gameplay fallback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadCourtPreview('2026-11-06', new AbortController().signal)).rejects.toThrow('401');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
