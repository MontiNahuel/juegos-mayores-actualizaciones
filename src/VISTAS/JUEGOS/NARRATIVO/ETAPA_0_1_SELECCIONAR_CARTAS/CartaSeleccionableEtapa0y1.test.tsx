import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CartaSeleccionableEtapa0y1 from './CartaSeleccionableEtapa0y1';

describe('selección de personajes', () => {
  it('marca sólo a los personajes para el detalle animado y conserva la selección accesible', () => {
    const onSelect = vi.fn();
    const personaje = { id: 'marcus', nombre: 'Marcus', titulo: 'Capitán', descripcion: 'Defiende el reino.' };
    const vista = render(<CartaSeleccionableEtapa0y1 carta={personaje} onSelect={onSelect} />);
    const carta = screen.getByRole('button');
    expect(carta.getAttribute('data-personaje')).toBe('true');
    fireEvent.click(carta);
    expect(onSelect).toHaveBeenCalledOnce();

    vista.rerender(<CartaSeleccionableEtapa0y1 carta={personaje} selected onSelect={onSelect} />);
    expect(carta.getAttribute('aria-pressed')).toBe('true');
    expect(carta.getAttribute('data-selected')).toBe('true');

    vista.rerender(<CartaSeleccionableEtapa0y1 carta={{ id: 'sello', nombre: 'Sello', categoria: 'Objeto' }} selected />);
    expect(carta.getAttribute('data-personaje')).toBe('false');
  });
});
