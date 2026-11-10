import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import { simularMovimiento } from '../../../../../tests/helpers/movimiento';
import { CoordinadorAnimacionConversacion } from './animacionesConversacion';

let raiz: HTMLDivElement;
let coordinador: CoordinadorAnimacionConversacion;
let reducir: (valor: boolean) => void;
const estado = { listo: true, intervencion: 'entrada', solo: true, hablante: 'elena' };
const entrada = () => gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:entrada')!;
const cambio = () => gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:intervencion')!;

beforeEach(() => {
  reducir = simularMovimiento();
  raiz = document.createElement('div');
  raiz.innerHTML = `
    <img class="fondo-a"><img class="fondo-b">
    <div class="titulo-narrativo__arte"></div>
    <div class="conversacion-personajes">
      <div class="conversacion-retrato" data-visible="true" data-activo="true"></div>
      <div class="conversacion-retrato" data-visible="false" data-activo="false"></div>
    </div>
    <div class="conversacion-dialogo"><div class="dialogo-narrativo__interior"></div></div>`;
  document.body.append(raiz);
  coordinador = new CoordinadorAnimacionConversacion(raiz);
});
afterEach(() => { coordinador.destruir(); raiz.remove(); vi.unstubAllGlobals(); });

it('cambiar de nodo reemplaza sólo la intervención y conserva la línea de tiempo de entrada', () => {
  coordinador.actualizar(estado);
  const presentacion = entrada();
  const anterior = cambio();
  const retratos = raiz.querySelectorAll<HTMLElement>('.conversacion-retrato');
  retratos[0].dataset.visible = 'false'; retratos[0].dataset.activo = 'false';
  retratos[1].dataset.visible = 'true'; retratos[1].dataset.activo = 'true';
  coordinador.actualizar({ ...estado, intervencion: 'respuesta', hablante: 'vera' });
  expect(entrada()).toBe(presentacion);
  expect(gsap.globalTimeline.getChildren()).not.toContain(anterior);
  cambio().progress(1);
  expect(Number(gsap.getProperty(retratos[0], 'opacity'))).toBe(0);
  expect(Number(gsap.getProperty(retratos[1], 'opacity'))).toBe(1);
});

it('reemplazar un fondo cancela su confirmación y confirma sólo la imagen vigente', () => {
  const [a, b] = raiz.querySelectorAll('img');
  const confirmarA = vi.fn(), confirmarB = vi.fn();
  coordinador.mostrarFondo(a, confirmarA);
  coordinador.mostrarFondo(b, confirmarB);
  expect(gsap.getTweensOf(a)).toHaveLength(0);
  gsap.getTweensOf(b)[0].progress(1);
  expect(confirmarA).not.toHaveBeenCalled();
  expect(confirmarB).toHaveBeenCalledTimes(1);
});

it('activar movimiento reducido termina lo pendiente y las siguientes imágenes se confirman sin espera', () => {
  coordinador.actualizar(estado);
  const fondo = raiz.querySelector('img')!;
  const confirmar = vi.fn();
  coordinador.mostrarFondo(fondo, confirmar);
  reducir(true);
  expect(raiz.dataset.animacion).toBe('lista');
  expect(confirmar).toHaveBeenCalledTimes(1);
  const siguiente = vi.fn();
  coordinador.mostrarFondo(raiz.querySelectorAll('img')[1], siguiente);
  expect(siguiente).toHaveBeenCalledTimes(1);
});

it('salir de la escena cancela animaciones y callbacks y revierte sus estilos', () => {
  coordinador.actualizar(estado);
  const fondo = raiz.querySelector('img')!;
  const confirmar = vi.fn();
  coordinador.mostrarFondo(fondo, confirmar);
  coordinador.destruir();
  expect(gsap.getTweensOf([...raiz.querySelectorAll('*')])).toHaveLength(0);
  expect(confirmar).not.toHaveBeenCalled();
  expect(fondo.style.opacity).toBe('');
});

it('los selectores de una conversación no animan otra escena montada', () => {
  const otra = document.createElement('div');
  otra.innerHTML = '<div class="conversacion-dialogo" style="opacity: .7"></div>';
  document.body.append(otra);
  coordinador.actualizar(estado);
  entrada().progress(1);
  expect((otra.firstChild as HTMLElement).style.opacity).toBe('0.7');
  otra.remove();
});

// Instala un cuerpo real sin introducir HTML proveniente de la historia.
function cuerpo(texto: string) {
  const bloque = document.createElement('span');
  bloque.className = 'dialogo-narrativo__revelado';
  bloque.dataset.texto = texto;
  const letras = document.createElement('span'); letras.className = 'dialogo-narrativo__caracteres';
  const cursor = document.createElement('span'); cursor.className = 'dialogo-narrativo__cursor';
  bloque.append(letras, cursor);
  raiz.querySelector('.dialogo-narrativo__interior')!.replaceChildren(bloque);
  return { bloque, letras, cursor };
}
const escritura = () => gsap.globalTimeline.getChildren().find(t => t.data === 'conversacion:escritura')!;

it('revela grafemas completos con fundido y desplazamiento simultáneos', () => {
  const { bloque, letras } = cuerpo('A👩🏽‍🚀e\u0301B');
  coordinador.actualizar(estado);
  const secuencia = escritura();
  secuencia.time(.1);
  expect(Number(gsap.getProperty(bloque, 'opacity'))).toBeGreaterThan(0);
  expect(Number(gsap.getProperty(bloque, 'opacity'))).toBeLessThan(1);
  expect(Number(gsap.getProperty(bloque, 'y'))).toBeGreaterThan(0);
  // El tween de caracteres tiene su propio ritmo, independiente del fundido de 240 ms.
  const letrasTween = (secuencia as gsap.core.Timeline).getChildren().find(t => t.vars.caracteres !== undefined)!;
  letrasTween.progress(.5);
  expect(letras.textContent).toBe('A👩🏽‍🚀');
  escritura().progress(1);
  expect(letras.textContent).toBe('A👩🏽‍🚀e\u0301B');
});

it('el scroll sigue la línea activa y se detiene cuando el jugador desplaza el panel', () => {
  const { cursor } = cuerpo('Una frase larga para verificar el seguimiento de la línea activa.');
  const panel = raiz.querySelector<HTMLElement>('.conversacion-dialogo')!;
  Object.defineProperties(panel, { scrollHeight: { value: 600 }, clientHeight: { value: 200 } });
  vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ bottom: 200 } as DOMRect);
  vi.spyOn(cursor, 'getBoundingClientRect').mockReturnValue({ bottom: 250 } as DOMRect);
  coordinador.actualizar(estado);
  escritura().progress(.2);
  const scroll = gsap.getTweensOf(panel).find(t => t.vars.scrollTop !== undefined)!;
  expect(scroll).toBeTruthy();
  scroll.progress(1);
  expect(panel.scrollTop).toBeGreaterThan(0);
  raiz.dispatchEvent(new Event('wheel'));
  const posicion = panel.scrollTop;
  escritura().progress(.6);
  expect(gsap.getTweensOf(panel).filter(t => t.vars.scrollTop !== undefined)).toHaveLength(0);
  expect(panel.scrollTop).toBe(posicion);
});

it('reemplazar la frase cancela la escritura anterior sin ejecutar su finalización', () => {
  coordinador.destruir();
  const finalizada = vi.fn();
  coordinador = new CoordinadorAnimacionConversacion(raiz, finalizada);
  cuerpo('Primera frase que todavía se está escribiendo.');
  coordinador.actualizar(estado);
  const anterior = escritura();
  anterior.progress(.2);
  const { letras } = cuerpo('La nueva frase.');
  coordinador.actualizar({ ...estado, intervencion: 'respuesta' });
  expect(gsap.globalTimeline.getChildren()).not.toContain(anterior);
  escritura().progress(1);
  expect(letras.textContent).toBe('La nueva frase.');
  expect(finalizada).toHaveBeenCalledExactlyOnceWith('respuesta');
});

it('un cambio de disposición no reinicia la escritura ni deja el texto a medio fundir', () => {
  const { letras, bloque } = cuerpo('La misma frase conserva su avance al redimensionar la escena.');
  coordinador.actualizar(estado);
  const actual = escritura();
  actual.progress(.3);
  const texto = letras.textContent;
  coordinador.actualizar({ ...estado, solo: false });
  expect(escritura()).toBe(actual);
  expect(letras.textContent).toBe(texto);
  escritura().progress(1);
  expect(Number(gsap.getProperty(bloque, 'opacity'))).toBe(1);
});

it('movimiento reducido muestra la frase completa y trata el marcado como texto literal', () => {
  const { letras } = cuerpo('<img src=x> — texto seguro');
  reducir(true);
  coordinador.actualizar(estado);
  expect(letras.textContent).toBe('<img src=x> — texto seguro');
  expect(letras.children).toHaveLength(0);
});

it('tocar acelera a 4× sin completar ni acumular multiplicadores y la siguiente frase vuelve a 1×', () => {
  coordinador.destruir();
  const finalizada = vi.fn();
  coordinador = new CoordinadorAnimacionConversacion(raiz, finalizada);
  const { letras } = cuerpo('Una frase extensa que el jugador decide leer a mayor velocidad.');
  coordinador.actualizar(estado);
  const actual = escritura();
  actual.pause().progress(.25);
  const texto = letras.textContent;
  coordinador.acelerarTexto();
  expect(actual.timeScale()).toBe(4);
  expect(actual.progress()).toBeCloseTo(.25);
  expect(letras.textContent).toBe(texto);
  expect(finalizada).not.toHaveBeenCalled();
  coordinador.acelerarTexto();
  expect(actual.timeScale()).toBe(4);
  cuerpo('La siguiente frase empieza sin aceleración.');
  coordinador.actualizar({ ...estado, intervencion: 'siguiente' });
  expect(escritura().timeScale()).toBe(1);
});

it('un toque conserva el seguimiento y el scroll acompaña la velocidad de escritura', () => {
  const { cursor } = cuerpo('Una frase larga para seguir leyendo mientras se acelera la animación.');
  const panel = raiz.querySelector<HTMLElement>('.conversacion-dialogo')!;
  Object.defineProperties(panel, { scrollHeight: { value: 600 }, clientHeight: { value: 200 } });
  vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ bottom: 200 } as DOMRect);
  vi.spyOn(cursor, 'getBoundingClientRect').mockReturnValue({ bottom: 250 } as DOMRect);
  coordinador.actualizar(estado);
  raiz.dispatchEvent(new Event('touchstart'));
  coordinador.acelerarTexto();
  escritura().progress(.2);
  const scroll = gsap.getTweensOf(panel).find(t => t.vars.scrollTop !== undefined)!;
  expect(scroll).toBeTruthy();
  expect(scroll.timeScale()).toBe(4);
  raiz.dispatchEvent(new Event('touchmove'));
  expect(gsap.getTweensOf(panel).filter(t => t.vars.scrollTop !== undefined)).toHaveLength(0);
});
