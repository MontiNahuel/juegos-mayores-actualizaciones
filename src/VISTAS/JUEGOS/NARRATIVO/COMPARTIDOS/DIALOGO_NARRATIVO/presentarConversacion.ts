import gsap from 'gsap';
import { RITMO } from './ritmoNarrativo';

/** Plan de entrada: título, retirada, panel, retratos y lectura. No resuelve nodos. */
export function presentarConversacion(raiz: HTMLElement, titulo: Element, personajes: Element, dialogo: Element, reducido: boolean) {
  const entrada = gsap.timeline({ data: 'conversacion:entrada', defaults: { ease: 'power2.out' } });
  entrada.addLabel('titulo', RITMO.titulo.entrada)
    .addLabel('personajes', RITMO.personajes.entrada)
    .addLabel('lectura', RITMO.dialogo.entrada);

  if (reducido) {
    entrada.set([titulo, personajes, dialogo], { autoAlpha: 1, y: 0 })
      .call(() => { raiz.dataset.animacion = 'lista'; })
      .set(titulo, { autoAlpha: 0 }, 2.5);
  } else {
    entrada.fromTo(titulo, { autoAlpha: 0 }, { autoAlpha: 1, duration: RITMO.titulo.duracion }, 'titulo')
      .to(titulo, { autoAlpha: 0, duration: RITMO.titulo.retirada }, RITMO.titulo.salida)
      .fromTo(personajes, { autoAlpha: 0 }, { autoAlpha: 1, duration: RITMO.personajes.duracion }, 'personajes')
      .fromTo(dialogo, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: RITMO.dialogo.duracion }, 'lectura')
      .call(() => { raiz.dataset.animacion = 'lista'; }, undefined, `personajes+=${RITMO.personajes.duracion}`);
  }
  return entrada;
}
