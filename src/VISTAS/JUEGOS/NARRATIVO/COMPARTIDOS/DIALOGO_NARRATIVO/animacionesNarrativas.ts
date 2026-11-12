import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

import { presentarConversacion } from './presentarConversacion';
import { RITMO } from './ritmoNarrativo';
import { AnimacionTexto } from './AnimacionTexto';

interface EstadoVisual {
  listo: boolean;
  intervencion: string;
  solo: boolean;
  hablante: string;
}

// Mediator de escena: ordena presentación, foco y lectura mediante bloques especializados.
// Cada bloque cancela sus propios tweens; ninguno avanza nodos ni modifica la partida.
export class CoordinadorAnimacionConversacion {
  private contexto: gsap.Context;
  private preferencias: gsap.MatchMedia;
  private entrada?: gsap.core.Timeline;
  private intervencion?: gsap.core.Timeline;
  private fondo?: gsap.core.Tween;
  private texto: AnimacionTexto;
  private presentada = false;
  private reducido = false;
  private anterior?: EstadoVisual;

  constructor(private raiz: HTMLElement, private onLecturaCompleta?: (intervencion: string) => void) {
    this.contexto = gsap.context(() => {}, raiz);
    this.preferencias = gsap.matchMedia();
    this.texto = new AnimacionTexto(raiz, onLecturaCompleta);
    this.preferencias.add({ siempre: 'all', reducido: '(prefers-reduced-motion: reduce)' }, context => {
      this.reducido = Boolean(context.conditions?.reducido);
      // Cambiar la preferencia termina lo pendiente sin volver a presentar la escena.
      if (this.presentada) {
        this.entrada?.progress(1);
        this.intervencion?.progress(1);
      }
      this.texto.reducir(this.reducido);
      if (this.reducido) this.fondo?.progress(1);
    });
  }

  // Conserva la entrada entre nodos; sólo reemplaza la secuencia de la intervención.
  actualizar(estado: EstadoVisual) {
    this.contexto.add(() => {
      const titulo = this.raiz.querySelector('.titulo-narrativo__arte');
      const personajes = this.raiz.querySelector('.conversacion-personajes');
      const dialogo = this.raiz.querySelector('.conversacion-dialogo');
      if (!titulo || !personajes || !dialogo) return;

      if (!estado.listo) {
        gsap.set([titulo, personajes, dialogo], { autoAlpha: 0 });
        return;
      }
      if (!this.presentada) {
        this.presentada = true;
        this.raiz.dataset.animacion = 'entrada';
        this.entrada = presentarConversacion(this.raiz, titulo, personajes, dialogo, this.reducido);
      }

      const cambioTexto = this.anterior?.intervencion !== estado.intervencion;
      const cambioRetratos = !this.anterior || this.anterior.solo !== estado.solo || this.anterior.hablante !== estado.hablante;
      if (cambioRetratos) {
        // kill() conserva la posición actual: un cambio rápido retoma el fundido desde ahí.
        this.intervencion?.kill();
        this.intervencion = gsap.timeline({ data: 'conversacion:intervencion', defaults: { ease: 'power2.out' } });
        const retratos = this.raiz.querySelectorAll<HTMLElement>('.conversacion-retrato');
        if (!this.anterior) gsap.set(retratos, {
          autoAlpha: (_indice, retrato: HTMLElement) => retrato.dataset.visible === 'false' ? 0 : retrato.dataset.activo === 'true' ? 1 : .45,
        });
        this.intervencion.to(retratos, {
          autoAlpha: (_indice, retrato: HTMLElement) => retrato.dataset.visible === 'false' ? 0 : retrato.dataset.activo === 'true' ? 1 : .45,
          duration: this.reducido ? 0 : RITMO.personajes.alternancia,
          overwrite: true,
        }, 0);
      }
      if (cambioTexto) this.escribirTexto(estado.intervencion);
      this.anterior = estado;
    });
  }

  // La escena decide cuándo leer; el bloque de texto posee su ejecución y cancelación.
  escribirTexto(intervencion: string, demoraInicial?: number) {
    this.texto.escribirTexto(intervencion, demoraInicial ?? Math.max(0,
      RITMO.personajes.entrada + RITMO.personajes.duracion - (this.entrada?.time() || 0)));
  }

  acelerarTexto() { this.texto.acelerarTexto(); }

  // La vista retira la capa anterior únicamente cuando GSAP confirma el fundido.
  mostrarFondo(imagen: HTMLImageElement, confirmar: () => void) {
    this.cancelarFondo();
    this.contexto.add(() => {
      this.fondo = gsap.fromTo(imagen, { autoAlpha: 0 }, {
        autoAlpha: 1, duration: this.reducido ? 0 : RITMO.fondo,
        ease: 'power2.out', onComplete: confirmar,
      });
    });
  }

  // Cambiar de recurso invalida su callback de finalización, sin confirmar una imagen vieja.
  cancelarFondo() { this.fondo?.kill(); }

  // Revierte estilos, timelines y oyentes, incluido el doble montaje de StrictMode.
  destruir() {
    this.texto.destruir();
    this.preferencias.revert();
    this.contexto.revert();
  }
}

// Adapta el ciclo de React al coordinador; los eventos tardíos entran en su contexto GSAP.
export function useAnimacionesConversacion(
  raiz: RefObject<HTMLDivElement | null>, estado: EstadoVisual,
  onLecturaCompleta: (intervencion: string) => void,
) {
  const coordinador = useRef<CoordinadorAnimacionConversacion | null>(null);
  useGSAP(() => {
    if (!raiz.current) return;
    const actual = new CoordinadorAnimacionConversacion(raiz.current, onLecturaCompleta);
    coordinador.current = actual;
    return () => { actual.destruir(); coordinador.current = null; };
  }, { scope: raiz });

  const { listo, intervencion, solo, hablante } = estado;
  useLayoutEffect(() => {
    coordinador.current?.actualizar({ listo, intervencion, solo, hablante });
  }, [listo, intervencion, solo, hablante]);

  const animarFondo = useCallback((imagen: HTMLImageElement, confirmar: () => void) => {
    if (coordinador.current) coordinador.current.mostrarFondo(imagen, confirmar);
    else confirmar();
  }, []);
  const cancelarFondo = useCallback(() => coordinador.current?.cancelarFondo(), []);
  const acelerarTexto = useCallback(() => coordinador.current?.acelerarTexto(), []);
  return { animarFondo, cancelarFondo, acelerarTexto };
}
