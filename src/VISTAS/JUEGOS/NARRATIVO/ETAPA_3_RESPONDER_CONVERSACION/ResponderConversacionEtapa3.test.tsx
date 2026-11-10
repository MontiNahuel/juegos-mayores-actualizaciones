import { prepararLectura, simularMovimiento, terminarFondo } from '../../../../../tests/helpers/movimiento';
import { StrictMode } from 'react';
import gsap from 'gsap';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  simularMovimiento();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('StrictMode limpia las secuencias al salir y permite abrir la conversación otra vez', () => {
  const primera = render(<StrictMode><ResponderConversacionEtapa3 conversacion={charla()} personajes={personajes} onElegir={vi.fn()} /></StrictMode>);
  prepararLectura(primera.container);
  const elementos = [...primera.container.querySelectorAll('*')];
  primera.unmount();
  expect(gsap.getTweensOf(elementos)).toHaveLength(0);
  const segunda = render(<StrictMode><ResponderConversacionEtapa3 conversacion={charla()} personajes={personajes} onElegir={vi.fn()} /></StrictMode>);
  prepararLectura(segunda.container);
  expect(screen.getByRole('button', { name: 'Escuchar' })).toBeVisible();
});

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

it('usa la imagen del nodo y conserva el fondo anterior hasta terminar el fundido', () => {
  const conversacion = { ...charla(), imagen: '/ilustracion-del-nodo.webp' };
  const { container, rerender } = render(<ResponderConversacionEtapa3 conversacion={conversacion} personajes={personajes} onElegir={vi.fn()} />);
  const primero = container.querySelector('.conversacion-fondo')!;
  expect(primero).toHaveAttribute('src', '/ilustracion-del-nodo.webp');
  fireEvent.load(primero);
  terminarFondo(primero);

  rerender(<ResponderConversacionEtapa3 conversacion={{ ...conversacion, nodo_id: 'otro', imagen: '/otra-ilustracion.webp' }} personajes={personajes} onElegir={vi.fn()} />);
  const nuevo = container.querySelector('img[src="/otra-ilustracion.webp"]')!;
  expect(primero).toBeInTheDocument();
  expect(primero).toHaveAttribute('data-visible', 'true');
  expect(nuevo).toHaveAttribute('data-visible', 'false');
  fireEvent.load(nuevo);
  expect(nuevo).toHaveAttribute('data-entrando', 'true');
  expect(primero).toBeInTheDocument();
  terminarFondo(nuevo);
  expect(primero).not.toBeInTheDocument();
  expect(container.querySelector('.conversacion-escena')).toHaveAttribute('data-intro', 'listo');
});

it('usa el salón si falta la imagen o falla su descarga, sin bloquear el relato', () => {
  const { container, rerender } = render(<ResponderConversacionEtapa3 conversacion={{ ...charla(), imagen: '/fallida.webp' }} personajes={personajes} onElegir={vi.fn()} />);
  fireEvent.error(container.querySelector('.conversacion-fondo')!);
  const respaldo = container.querySelector('.conversacion-fondo')!;
  expect(respaldo).toHaveAttribute('src', '/assets/narrative/conversation-hall.png');
  fireEvent.load(respaldo);
  terminarFondo(respaldo);
  rerender(<ResponderConversacionEtapa3 conversacion={charla('sin-imagen')} personajes={personajes} onElegir={vi.fn()} />);
  expect(container.querySelector('.conversacion-fondo')).toBe(respaldo);
  expect(container.querySelector('.conversacion-escena')).toHaveAttribute('data-intro', 'listo');
});

it('una carga atrasada no reemplaza el fondo del nodo vigente', () => {
  const { container, rerender } = render(<ResponderConversacionEtapa3 conversacion={{ ...charla(), imagen: '/inicial.webp' }} personajes={personajes} onElegir={vi.fn()} />);
  const inicial = container.querySelector('.conversacion-fondo')!;
  fireEvent.load(inicial);
  terminarFondo(inicial);
  rerender(<ResponderConversacionEtapa3 conversacion={{ ...charla('intermedio'), imagen: '/lenta.webp' }} personajes={personajes} onElegir={vi.fn()} />);
  const lenta = container.querySelector('img[src="/lenta.webp"]')!;
  rerender(<ResponderConversacionEtapa3 conversacion={{ ...charla('vigente'), imagen: '/vigente.webp' }} personajes={personajes} onElegir={vi.fn()} />);
  fireEvent.load(lenta);
  fireEvent.load(inicial);
  expect(container.querySelector('img[src="/vigente.webp"]')).toHaveAttribute('data-visible', 'false');
  fireEvent.load(container.querySelector('img[src="/vigente.webp"]')!);
  expect(container.querySelector('img[src="/vigente.webp"]')).toHaveAttribute('data-entrando', 'true');
  expect(lenta).not.toBeInTheDocument();
});

it('una falla del salón no impide leer el diálogo', () => {
  const { container } = render(<ResponderConversacionEtapa3 conversacion={charla()} personajes={personajes} onElegir={vi.fn()} />);
  fireEvent.error(container.querySelector('.conversacion-fondo')!);
  expect(container.querySelector('.conversacion-escena')).toHaveAttribute('data-intro', 'listo');
  expect(screen.getByText('Habla elena: entrada')).toBeInTheDocument();
});

it('al cambiar de hablante conserva el fondo, título y retrato y sólo renueva la intervención', () => {
  let estado = reducer(undefined, mostrarConversacion(charla()));
  const onElegir = vi.fn();
  const { container, rerender } = render(<ResponderConversacionEtapa3 conversacion={estado.conversacionActual} personajes={personajes} onElegir={onElegir} />);
  const fondo = container.querySelector('.conversacion-fondo')!;
  fireEvent.load(fondo);
  prepararLectura(container);
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
  fireEvent.click(screen.getByRole('button', { name: /acelerar lectura/i }));
  act(() => { gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:escritura')!.progress(1); });
  fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
  expect(onElegir).not.toHaveBeenCalled();
});

it('tocar cualquier parte del texto acelera sin avanzar ni habilitar las opciones antes de tiempo', () => {
  const onElegir = vi.fn();
  const conversacion = charla();
  conversacion.frases.push({ personajeId: 'vera', texto: 'Ahora responde Vera.' });
  const { container } = render(<ResponderConversacionEtapa3 conversacion={conversacion} personajes={personajes} onElegir={onElegir} />);
  // Sólo prepara las imágenes y la entrada; la escritura sigue en curso.
  fireEvent.load(container.querySelector('.titulo-narrativo__arte img')!);
  fireEvent.load(container.querySelector('.conversacion-fondo')!);
  act(() => { gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:entrada')!.progress(1); });
  expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
  const timeline = gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:escritura')!;
  fireEvent.click(container.querySelector('.dialogo-narrativo__caracteres')!);
  expect(timeline.timeScale()).toBe(4);
  expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
  expect(onElegir).not.toHaveBeenCalled();
  act(() => { timeline.progress(1); });
  expect(container.querySelector('.dialogo-narrativo__caracteres')).toHaveTextContent('Habla elena: entrada');
  expect(container.querySelector('.dialogo-narrativo__revelado')).toHaveAttribute('data-texto', 'Habla elena: entrada');
  expect(onElegir).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /Tocá para continuar/ }));
  expect(container.querySelector('.dialogo-narrativo__caracteres')).toHaveTextContent('');
  expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /acelerar lectura/i }));
  act(() => { gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:escritura')!.progress(1); });
  fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
  expect(onElegir).toHaveBeenCalledTimes(1);
});

it('terminar la última frase conserva su nodo de texto y habilita las decisiones', () => {
  const { container } = render(<ResponderConversacionEtapa3 conversacion={charla()} personajes={personajes} onElegir={vi.fn()} />);
  fireEvent.load(container.querySelector('.titulo-narrativo__arte img')!);
  fireEvent.load(container.querySelector('.conversacion-fondo')!);
  act(() => { gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:entrada')!.progress(1); });
  const letras = container.querySelector('.dialogo-narrativo__caracteres');
  const guia = container.querySelector('.dialogo-narrativo__progresivo');
  fireEvent.click(container.querySelector('.dialogo-narrativo__progresivo')!);
  act(() => { gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:escritura')!.progress(1); });
  expect(container.querySelector('.dialogo-narrativo__caracteres')).toBe(letras);
  expect(container.querySelector('.dialogo-narrativo__progresivo')).toBe(guia);
  expect(letras).toHaveTextContent('Habla elena: entrada');
  expect(screen.getByRole('button', { name: 'Escuchar' })).toBeEnabled();
});

it('reinicia la lectura al recibir otro nodo y nunca atribuye el narrador a un personaje', () => {
  const conversacion = charla();
  conversacion.frases.push({ personajeId: 'vera', texto: 'Una segunda frase' });
  const { container, rerender } = render(<ResponderConversacionEtapa3 conversacion={conversacion} personajes={personajes} onElegir={vi.fn()} />);
  prepararLectura(container);
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
