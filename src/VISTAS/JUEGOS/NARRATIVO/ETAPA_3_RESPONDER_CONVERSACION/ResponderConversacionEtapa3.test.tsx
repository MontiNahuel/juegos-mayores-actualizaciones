import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import reducer, { guardarResultado, mostrarConversacion } from '../../../../store/narrativoSelectionSlice';
import type { ConversacionApi } from '../narrativeService';
import ResponderConversacionEtapa3 from './ResponderConversacionEtapa3';

vi.mock('../../../../services/assetPreloader', () => ({ imagenPrecargada: (src: string) => src }));
const personajes = [
  { _id: 'elena', nombre: 'Elena', titulo: '', descripcion: '', imagen: '/elena.png' },
  { _id: 'vera', nombre: 'Vera', titulo: '', descripcion: '', imagen: '/vera.png' },
];
const charla = (nodo = 'entrada', hablante = 'elena', id = 'audiencia'): ConversacionApi => ({
  _id: id, nodo_id: nodo, titulo: 'La audiencia', imagen: '',
  requisitos: [{ personajeId: hablante }], frases: [{ personajeId: hablante, texto: `Habla ${hablante}: ${nodo}` }],
  decisiones: [{ opcion: 'escuchar', texto: 'Escuchar', resultado_texto: '', impacto_afinidad: [] }],
});
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('conserva el reparto en orden entre nodos y lo reinicia al cambiar de conversación', () => {
  let estado = reducer(undefined, mostrarConversacion(charla()));
  estado = reducer(estado, mostrarConversacion(charla('respuesta', 'vera')));
  estado = reducer(estado, mostrarConversacion(charla('cierre', 'elena')));
  expect(estado.conversacionActual.requisitos).toEqual([{ personajeId: 'elena' }, { personajeId: 'vera' }]);
  estado = reducer(estado, mostrarConversacion(charla('entrada', 'vera', 'otra')));
  expect(estado.conversacionActual.requisitos).toEqual([{ personajeId: 'vera' }]);
});

it('una conversación confirmada reemplaza el resultado anterior para que no lo siga tapando', () => {
  let estado = reducer(undefined, guardarResultado({ titulo: 'Resultado', efectos: [] }));
  estado = reducer(estado, mostrarConversacion(charla()));
  expect(estado.resultadoActual).toBeNull();
  expect(estado.jugador.fase_actual).toBe('responder_conversacion');
});

it('al cambiar de hablante conserva el fondo, título y retrato y sólo renueva la intervención', () => {
  let estado = reducer(undefined, mostrarConversacion(charla()));
  const onElegir = vi.fn();
  const { container, rerender } = render(<ResponderConversacionEtapa3 conversacion={estado.conversacionActual} personajes={personajes} onElegir={onElegir} />);
  const fondo = container.querySelector('.conversacion-fondo')!;
  fireEvent.load(fondo);
  const titulo = container.querySelector('.titulo-narrativo');
  const retrato = screen.getByAltText('Elena');
  const dialogo = container.querySelector('.conversacion-dialogo');
  dialogo!.scrollTop = 120;
  const intervencion = container.querySelector('.dialogo-narrativo__interior');
  estado = reducer(estado, mostrarConversacion(charla('respuesta', 'vera')));
  rerender(<ResponderConversacionEtapa3 conversacion={estado.conversacionActual} personajes={personajes} onElegir={onElegir} enviando />);
  expect(container.querySelector('.conversacion-fondo')).toBe(fondo);
  expect(container.querySelector('.titulo-narrativo')).toBe(titulo);
  expect(screen.getByAltText('Elena')).toBe(retrato);
  expect(container.querySelector('.conversacion-dialogo')).toBe(dialogo);
  expect(dialogo!.scrollTop).toBe(0);
  expect(dialogo).toHaveFocus();
  expect(container.querySelector('.dialogo-narrativo__interior')).not.toBe(intervencion);
  expect(container.querySelector('.conversacion-escena')).toHaveAttribute('data-intro', 'listo');
  expect(screen.getByAltText('Vera').closest('.conversacion-retrato')).toHaveAttribute('data-visible', 'true');
  expect(retrato.closest('.conversacion-retrato')).toHaveAttribute('data-visible', 'false');
  fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
  expect(onElegir).not.toHaveBeenCalled();
});

it('reinicia la lectura al recibir otro nodo y nunca atribuye el narrador a un personaje', () => {
  const conversacion = charla();
  conversacion.frases.push({ personajeId: 'vera', texto: 'Una segunda frase' });
  const { rerender } = render(<ResponderConversacionEtapa3 conversacion={conversacion} personajes={personajes} onElegir={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Tocá para continuar/ }));
  expect(screen.getByText('Una segunda frase')).toBeInTheDocument();
  rerender(<ResponderConversacionEtapa3 conversacion={charla('relato', 'narrador')} personajes={personajes} onElegir={vi.fn()} />);
  expect(screen.getByText('Habla narrador: relato')).toBeInTheDocument();
  expect(screen.getByText('Crónicas del Reino')).toBeInTheDocument();
  rerender(<ResponderConversacionEtapa3 conversacion={conversacion} personajes={personajes} onElegir={vi.fn()} />);
  expect(screen.getByText('Habla elena: entrada')).toBeInTheDocument();
});

it('un nuevo retrato no hereda la imagen oculta de un personaje que falló', () => {
  const corte = [...personajes, { ...personajes[0], _id: 'ines', nombre: 'Inés', imagen: '/ines.png' }];
  const anterior = { ...charla('respuesta', 'vera'), requisitos: corte.map(p => ({ personajeId: p._id })) };
  const { rerender } = render(<ResponderConversacionEtapa3 conversacion={anterior} personajes={corte} onElegir={vi.fn()} />);
  fireEvent.error(screen.getByAltText('Vera'));
  expect(screen.getByAltText('Vera')).toHaveClass('hidden');

  const siguiente = { ...anterior, nodo_id: 'consulta', frases: [{ personajeId: 'ines', texto: 'Inés toma la palabra.' }] };
  rerender(<ResponderConversacionEtapa3 conversacion={siguiente} personajes={corte} onElegir={vi.fn()} />);
  expect(screen.getByAltText('Inés')).not.toHaveClass('hidden');
});
