import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsejosCarrusel } from '../components/consejos/ConsejosCarrusel';
import type { ConsejoPerfil } from '../services/perfilService';

vi.mock('@ionic/react', () => ({
  IonIcon: () => <span aria-hidden="true" />,
}));

function consejos(cantidad: number): ConsejoPerfil[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    id: `c${indice + 1}`,
    texto: `Consejo ${indice + 1}`,
    fuente: `Fuente ${indice + 1}`,
    url: `https://ejemplo.com/${indice + 1}`,
  }));
}

const puntosDePagina = () =>
  screen.queryAllByRole('button', { name: /^Consejo \d+ de \d+$/ });

afterEach(cleanup);

describe('ConsejosCarrusel', () => {
  it('muestra la fuente como texto y no como enlace', () => {
    render(<ConsejosCarrusel consejos={consejos(2)} motivos={{}} />);

    expect(screen.getByText('Fuente: Fuente 1')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('antepone el motivo solo al consejo con situación', () => {
    const [conSituacion, general] = consejos(2);
    render(
      <ConsejosCarrusel
        consejos={[
          { ...conSituacion, situacion: 'eje_desequilibrado' },
          general,
        ]}
        motivos={{ eje_desequilibrado: 'Practicaste Lógica 3× más que Vocabulario.' }}
      />,
    );

    expect(
      screen.getByText('Practicaste Lógica 3× más que Vocabulario.'),
    ).toBeInTheDocument();

    const motivos = screen.getAllByText(/Practicaste Lógica/);
    expect(motivos).toHaveLength(1);
  });

  it('navega con las flechas sin puntos de paginación', () => {
    render(<ConsejosCarrusel consejos={consejos(6)} motivos={{}} />);

    expect(puntosDePagina()).toHaveLength(0);

    const siguiente = screen.getByRole('button', { name: 'Consejo siguiente' });
    fireEvent.click(siguiente);
    fireEvent.click(siguiente);
    expect(screen.getByRole('list')).toHaveStyle({ transform: 'translateX(-200%)' });

    fireEvent.click(screen.getByRole('button', { name: 'Consejo anterior' }));
    expect(screen.getByRole('list')).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('oculta flechas y puntos cuando hay un solo consejo', () => {
    render(<ConsejosCarrusel consejos={consejos(1)} motivos={{}} />);

    expect(screen.queryByRole('button', { name: 'Consejo siguiente' })).not.toBeInTheDocument();
    expect(puntosDePagina()).toHaveLength(0);
  });
});
