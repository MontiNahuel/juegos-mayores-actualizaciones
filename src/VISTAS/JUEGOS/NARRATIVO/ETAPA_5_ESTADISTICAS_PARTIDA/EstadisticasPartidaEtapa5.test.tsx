import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EstadisticasPartidaEtapa5 from './EstadisticasPartidaEtapa5';

const recursos = { oro: 50, pueblo: 50, ejercito: 50, fe: 50 };

describe('pantalla de crónica', () => {
  it('permite explorar cada etapa y leer la decisión y la corte junto a los gráficos', () => {
    render(<EstadisticasPartidaEtapa5
      estado={{ recursos: { ...recursos, oro: 60 } }}
      historial={{ historial_mensual: [
        { mes: 1, evento_id: 'e1', recursos_fin_mes: recursos },
        { mes: 2, evento_id: 'e2', opcion_elegida_id: 'o2', recursos_fin_mes: { ...recursos, oro: 60 } },
      ] }}
      catalogos={{
        cartas: [], resultados: [], conversaciones: [],
        eventos: [
          { _id: 'e1', titulo: 'La helada' },
          { _id: 'e2', titulo: 'El mercado', opciones: [{ id: 'o2', texto: 'Comprar grano' }] },
        ],
      }}
      recursosIniciales={recursos}
      personajes={[{ _id: 'p1', nombre: 'Elena', titulo: 'Canciller', descripcion: '' }]}
      corte={{ corte: [{ personaje: { _id: 'p1', nombre: 'Elena', titulo: 'Canciller', descripcion: '' }, afinidad: 72 }] }}
      onVolver={vi.fn()}
    />);

    expect(screen.getByRole('heading', { name: 'El pulso del reino' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lo que ganaste y perdiste' })).toBeTruthy();
    expect(screen.getByText('Relación cercana · 72/100')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mes 2' }));
    expect(screen.getByRole('heading', { name: 'Mes 2: El mercado' })).toBeTruthy();
    expect(screen.getByText('Comprar grano')).toBeTruthy();
    expect(screen.getByText('+10')).toBeTruthy();
  });
});
