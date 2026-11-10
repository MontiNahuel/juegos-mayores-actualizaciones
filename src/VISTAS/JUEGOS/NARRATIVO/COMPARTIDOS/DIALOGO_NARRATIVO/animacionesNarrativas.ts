import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

// Tiempos en segundos, velocidad en grafemas/segundo y desplazamientos en píxeles.
const RITMO = {
  fondo: .42,
  titulo: { entrada: .08, duracion: .42, salida: 1.35, retirada: .55 },
  personajes: { entrada: 1.48, duracion: .65, alternancia: .65 },
  dialogo: { entrada: 1.68, duracion: .48 },
  texto: { caracteresPorSegundo: 28, aceleracion: 4, morfema: .13, fundido: .24, desplazamiento: 4, scroll: .22, margenScroll: 20 },
};

// Glifos ficticios, sin correspondencia con el alfabeto del texto.
const GLIFOS_ARCANOS = ['ᛯ', '⟁', 'ᚸ', '᛭', '⟊', 'ᛝ', '⟐', 'ᚥ', 'ᛨ', 'ᛦ'];

interface EstadoVisual {
  listo: boolean;
  intervencion: string;
  solo: boolean;
  hablante: string;
}

// Mediator: las vistas notifican intención o carga, y este objeto es el único
// que crea/cancela animaciones. Nunca avanza nodos ni modifica la partida.
export class CoordinadorAnimacionConversacion {
  private contexto: gsap.Context;
  private preferencias: gsap.MatchMedia;
  private entrada?: gsap.core.Timeline;
  private intervencion?: gsap.core.Timeline;
  private fondo?: gsap.core.Tween;
  private escritura?: gsap.core.Timeline;
  private scroll?: gsap.core.Tween;
  private transformaciones = new Set<gsap.core.Tween>();
  private seguimiento = true;
  private presentada = false;
  private reducido = false;
  private anterior?: EstadoVisual;

  constructor(private raiz: HTMLElement, private onLecturaCompleta?: (intervencion: string) => void) {
    this.contexto = gsap.context(() => {}, raiz);
    this.preferencias = gsap.matchMedia();
    raiz.addEventListener('wheel', this.pausarSeguimiento, { passive: true });
    raiz.addEventListener('touchmove', this.pausarSeguimiento, { passive: true });
    raiz.addEventListener('keydown', this.controlarTeclado);
    this.preferencias.add({ siempre: 'all', reducido: '(prefers-reduced-motion: reduce)' }, context => {
      this.reducido = Boolean(context.conditions?.reducido);
      // Cambiar la preferencia termina lo pendiente sin volver a presentar la escena.
      if (this.presentada) {
        this.entrada?.progress(1);
        this.intervencion?.progress(1);
      }
      if (this.reducido) {
        this.escritura?.progress(1);
        this.transformaciones.forEach(transformacion => transformacion.progress(1));
      }
      if (this.reducido) this.fondo?.progress(1);
      if (this.reducido) this.scroll?.kill();
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
        this.entrada = gsap.timeline({ data: 'conversacion:entrada', defaults: { ease: 'power2.out' } });
        this.entrada.addLabel('titulo', RITMO.titulo.entrada)
          .addLabel('personajes', RITMO.personajes.entrada)
          .addLabel('lectura', RITMO.dialogo.entrada);

        if (this.reducido) {
          this.entrada.set([titulo, personajes, dialogo], { autoAlpha: 1, y: 0 })
            .call(() => { this.raiz.dataset.animacion = 'lista'; })
            .set(titulo, { autoAlpha: 0 }, 2.5);
        } else {
          this.entrada.fromTo(titulo, { autoAlpha: 0 }, { autoAlpha: 1, duration: RITMO.titulo.duracion }, 'titulo')
            .to(titulo, { autoAlpha: 0, duration: RITMO.titulo.retirada }, RITMO.titulo.salida)
            .fromTo(personajes, { autoAlpha: 0 }, { autoAlpha: 1, duration: RITMO.personajes.duracion }, 'personajes')
            .fromTo(dialogo, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: RITMO.dialogo.duracion }, 'lectura')
            .call(() => { this.raiz.dataset.animacion = 'lista'; }, undefined, `lectura+=${RITMO.dialogo.duracion}`);
        }
      }

      const cambioTexto = this.anterior?.intervencion !== estado.intervencion;
      const cambioRetratos = cambioTexto || this.anterior?.solo !== estado.solo || this.anterior?.hablante !== estado.hablante;
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

  // GSAP revela grafemas, no fragmentos UTF-16: tildes y emoji aparecen completos.
  // Se escribe textContent para que el contenido del backend nunca se interprete como HTML.
  escribirTexto(intervencion: string, demoraInicial?: number) {
    this.contexto.add(() => this.iniciarEscritura(intervencion, demoraInicial));
  }

  private iniciarEscritura(intervencion: string, demoraInicial?: number) {
    this.escritura?.kill();
    this.scroll?.kill();
    this.transformaciones.forEach(transformacion => transformacion.kill());
    this.transformaciones.clear();
    this.seguimiento = true;
    const bloque = this.raiz.querySelector<HTMLElement>('.dialogo-narrativo__revelado');
    const destino = bloque?.querySelector<HTMLElement>('.dialogo-narrativo__caracteres');
    const marcador = bloque?.querySelector<HTMLElement>('.dialogo-narrativo__cursor');
    const texto = bloque?.dataset.texto || '';
    const panel = this.raiz.querySelector<HTMLElement>('.dialogo-narrativo, .conversacion-dialogo');
    if (!bloque || !destino) return;
    if (this.reducido || !texto) {
      this.escritura = undefined;
      gsap.set(bloque, { opacity: 1, y: 0 });
      destino.textContent = texto;
      this.onLecturaCompleta?.(intervencion);
      return;
    }
    const caracteres = typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(texto), parte => parte.segment)
      : Array.from(texto);
    destino.textContent = '';
    const cursor = { caracteres: 0 };
    let ultimo = 0;
    let ultimaLinea = -Infinity;
    const demora = demoraInicial ?? Math.max(0, RITMO.dialogo.entrada + RITMO.dialogo.duracion - (this.entrada?.time() || 0));
    const duracionEscritura = caracteres.length / RITMO.texto.caracteresPorSegundo;
    this.escritura = gsap.timeline({
      data: 'conversacion:escritura',
      delay: demora,
      onComplete: () => {
        destino.textContent = texto;
        this.onLecturaCompleta?.(intervencion);
        if (panel) this.desplazarLectura(panel, panel.scrollHeight - panel.clientHeight);
      },
    });
    // El fundido y el desplazamiento empiezan junto con la escritura, no como pasos aislados.
    this.escritura.fromTo(bloque, { opacity: 0, y: RITMO.texto.desplazamiento }, {
      opacity: 1, y: 0, duration: RITMO.texto.fundido, ease: 'power2.out',
    }, 0).to(cursor, {
      caracteres: caracteres.length, snap: 'caracteres', ease: 'none',
      duration: duracionEscritura,
      onUpdate: () => {
        if (ultimo === cursor.caracteres) return;
        if (cursor.caracteres < ultimo) {
          this.transformaciones.forEach(transformacion => transformacion.kill());
          this.transformaciones.clear();
          destino.textContent = '';
          ultimo = 0;
        }
        const fragmento = document.createDocumentFragment();
        const glifosNuevos: HTMLElement[] = [];
        for (let indice = ultimo; indice < cursor.caracteres; indice += 1) {
          const caracter = caracteres[indice];
          if (/\p{L}/u.test(caracter)) {
            const glifo = document.createElement('span');
            glifo.className = 'dialogo-narrativo__glifo';
            glifo.dataset.arcano = GLIFOS_ARCANOS[(indice + intervencion.length) % GLIFOS_ARCANOS.length];
            glifo.style.setProperty('--glifo-real', '0');
            glifo.style.setProperty('--glifo-arcano', '1');
            glifo.style.setProperty('--glifo-recorrido', '-0.14em');
            glifo.style.setProperty('--glifo-giro', '-65deg');
            const textoLegible = document.createElement('span');
            textoLegible.textContent = caracter;
            glifo.append(textoLegible);
            fragmento.append(glifo);
            glifosNuevos.push(glifo);
          } else {
            fragmento.append(document.createTextNode(caracter));
          }
        }
        destino.append(fragmento);
        ultimo = cursor.caracteres;
        glifosNuevos.forEach(glifo => this.animarGlifo(glifo));
        if (!panel || !marcador || panel.scrollHeight <= panel.clientHeight) return;
        const linea = marcador.getBoundingClientRect().bottom + panel.scrollTop;
        if (Math.abs(linea - ultimaLinea) < 1) return;
        ultimaLinea = linea;
        const exceso = marcador.getBoundingClientRect().bottom - panel.getBoundingClientRect().bottom + RITMO.texto.margenScroll;
        if (exceso > 0) this.desplazarLectura(panel, panel.scrollTop + exceso);
      },
    }, 0).call(() => {}, undefined, duracionEscritura + RITMO.texto.morfema);
  }

  // El glifo arcano se desplaza y se desvanece mientras aparece la letra legible.
  private animarGlifo(glifo: HTMLElement) {
    this.contexto.add(() => {
      let transformacion: gsap.core.Tween;
      transformacion = gsap.to(glifo, {
        '--glifo-real': 1,
        '--glifo-arcano': 0,
        '--glifo-recorrido': '0.14em',
        '--glifo-giro': '55deg',
        duration: RITMO.texto.morfema,
        ease: 'power2.out',
        onComplete: () => this.transformaciones.delete(transformacion),
      });
      transformacion.timeScale(this.escritura?.timeScale() || 1);
      this.transformaciones.add(transformacion);
    });
  }

  // Sigue cada línea con un tween reemplazable; nunca combate el scroll manual del jugador.
  private desplazarLectura(panel: HTMLElement, posicion: number) {
    if (!this.seguimiento || this.reducido) return;
    const destino = Math.max(0, Math.min(posicion, panel.scrollHeight - panel.clientHeight));
    if (Math.abs(destino - panel.scrollTop) < 1) return;
    this.scroll?.kill();
    this.contexto.add(() => {
      this.scroll = gsap.to(panel, { scrollTop: destino, duration: RITMO.texto.scroll, ease: 'power2.out', overwrite: 'auto' })
        .timeScale(this.escritura?.timeScale() || 1);
    });
  }

  private pausarSeguimiento = () => { this.seguimiento = false; this.scroll?.kill(); };
  private controlarTeclado = (evento: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(evento.key)) this.pausarSeguimiento();
  };

  // +300% equivale a 4×. No cambia el progreso ni acumula velocidad con cada toque.
  // Cada frase crea su propia timeline, por lo que la siguiente vuelve al ritmo normal.
  acelerarTexto() {
    this.escritura?.timeScale(RITMO.texto.aceleracion);
    this.scroll?.timeScale(RITMO.texto.aceleracion);
    this.transformaciones.forEach(transformacion => transformacion.timeScale(RITMO.texto.aceleracion));
  }

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
    this.raiz.removeEventListener('wheel', this.pausarSeguimiento);
    this.raiz.removeEventListener('touchmove', this.pausarSeguimiento);
    this.raiz.removeEventListener('keydown', this.controlarTeclado);
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
