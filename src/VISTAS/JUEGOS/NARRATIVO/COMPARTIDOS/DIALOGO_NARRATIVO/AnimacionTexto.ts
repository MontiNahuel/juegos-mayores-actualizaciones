import gsap from 'gsap';
import { RITMO, GLIFOS_ARCANOS } from './ritmoNarrativo';

// Dueño exclusivo de escritura, glifos y seguimiento de lectura; independiente de la escena.
export class AnimacionTexto {
  private contexto: gsap.Context;
  private reducido = false;
  private preferencias = gsap.matchMedia();
  private escritura?: gsap.core.Timeline;
  private scroll?: gsap.core.Tween;
  private transformaciones = new Set<gsap.core.Tween>();
  private seguimiento = true;

  constructor(private raiz: HTMLElement, private onLecturaCompleta?: (intervencion: string) => void, private caracteresPorSegundo = RITMO.texto.caracteresPorSegundo) {
    this.contexto = gsap.context(() => {}, raiz);
    this.preferencias.add({ siempre: 'all', reducido: '(prefers-reduced-motion: reduce)' }, contexto => {
      this.reducir(Boolean(contexto.conditions?.reducido));
    });
    raiz.addEventListener('wheel', this.pausarSeguimiento, { passive: true });
    raiz.addEventListener('touchmove', this.pausarSeguimiento, { passive: true });
    raiz.addEventListener('keydown', this.controlarTeclado);
  }

  // Completa la lectura cuando cambia la preferencia, sin reiniciar el nodo.
  reducir(valor: boolean) {
    this.reducido = valor;
    if (!valor) return;
    this.escritura?.progress(1);
    this.transformaciones.forEach(t => t.progress(1));
    this.scroll?.kill();
  }

  destruir() {
    this.raiz.removeEventListener('wheel', this.pausarSeguimiento);
    this.raiz.removeEventListener('touchmove', this.pausarSeguimiento);
    this.raiz.removeEventListener('keydown', this.controlarTeclado);
    this.preferencias.revert();
    this.contexto.revert();
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
    const demora = demoraInicial ?? 0;
    const duracionEscritura = caracteres.length / this.caracteresPorSegundo;
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

}
