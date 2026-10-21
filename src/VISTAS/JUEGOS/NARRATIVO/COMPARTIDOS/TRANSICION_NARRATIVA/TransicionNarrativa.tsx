import { Component, createRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  etapa: string;
  children: ReactNode;
}

const DURACION_MS = 280;

// Compatible con React estable. La copia de salida es solo visual e inerte:
// no mantiene componentes React ni duplica sus efectos o manejadores.
export default class TransicionNarrativa extends Component<Props> {
  private contenedor = createRef<HTMLDivElement>();
  private salida: HTMLDivElement | null = null;
  private animaciones: Animation[] = [];

  private movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private limpiar = () => {
    this.animaciones.forEach(animacion => animacion.cancel());
    this.animaciones = [];
    this.salida?.remove();
    this.salida = null;
  };

  getSnapshotBeforeUpdate(prevProps: Props): HTMLDivElement | null {
    if (prevProps.etapa === this.props.etapa) return null;
    this.limpiar();
    const actual = this.contenedor.current?.firstElementChild;
    if (this.movimientoReducido() || !(actual instanceof HTMLElement) || !actual.animate) return null;

    const limites = actual.getBoundingClientRect();
    const copia = actual.cloneNode(true) as HTMLElement;
    // Congela las animaciones internas donde estaban, antes de sustituir la etapa.
    const originales = [actual, ...actual.querySelectorAll<HTMLElement>('*')];
    const copias = [copia, ...copia.querySelectorAll<HTMLElement>('*')];
    originales.forEach((elemento, indice) => {
      const estilo = getComputedStyle(elemento);
      const destino = copias[indice];
      destino.style.animation = 'none';
      destino.style.transition = 'none';
      destino.style.opacity = estilo.opacity;
      destino.style.visibility = estilo.visibility;
      destino.style.transform = estilo.transform;
      destino.removeAttribute('id');
      destino.removeAttribute('autofocus');
    });
    Object.assign(copia.style, {
      position: 'absolute', top: `${limites.top}px`, left: `${limites.left}px`,
      width: `${limites.width}px`, height: `${limites.height}px`, minHeight: '0', margin: '0',
    });

    const salida = document.createElement('div');
    Object.assign(salida.style, {
      position: 'fixed', inset: '0', zIndex: '1000', overflow: 'hidden', pointerEvents: 'none',
    });
    salida.setAttribute('aria-hidden', 'true');
    salida.inert = true;
    salida.append(copia);
    return salida;
  }

  componentDidUpdate(prevProps: Props, _prevState: unknown, snapshot: HTMLDivElement | null) {
    if (prevProps.etapa === this.props.etapa || !snapshot) return;
    const actual = this.contenedor.current?.firstElementChild;
    if (!(actual instanceof HTMLElement)) return;

    this.salida = snapshot;
    document.body.append(snapshot);
    const salida = snapshot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DURACION_MS, easing: 'ease-in-out' });
    const entrada = actual.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURACION_MS, easing: 'ease-in-out' });
    this.animaciones = [salida, entrada];
    // Un cambio rapido puede cancelar esta animacion; su copia tambien se retira.
    void salida.finished.then(() => {
      if (this.salida === snapshot) this.limpiar();
    }).catch(() => snapshot.remove());
  }

  componentWillUnmount() { this.limpiar(); }

  render() {
    // No agrega altura ni cambia la distribucion o el centrado de las etapas.
    return <div ref={this.contenedor} className="contents">{this.props.children}</div>;
  }
}
