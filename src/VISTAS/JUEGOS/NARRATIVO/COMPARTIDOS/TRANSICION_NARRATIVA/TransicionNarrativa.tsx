import { Component, createRef, type ReactNode } from 'react';
import gsap from 'gsap';

interface Props { etapa: string; children: ReactNode }
interface Estado { etapa: string; contenido: ReactNode }

/** Barrera de presentación: conserva React y sus imágenes hasta terminar la salida.
 * El commander publica el destino; esta capa confirma visualmente el cambio.
 * Si llegan varios destinos durante la salida, presenta únicamente el último.
 */
export default class TransicionNarrativa extends Component<Props, Estado> {
  state: Estado = { etapa: this.props.etapa, contenido: this.props.children };
  private contenedor = createRef<HTMLDivElement>();
  private salida?: gsap.core.Tween;

  static getDerivedStateFromProps(props: Props, estado: Estado) {
    return props.etapa === estado.etapa ? { contenido: props.children } : null;
  }

  componentDidUpdate() {
    if (this.salida || this.props.etapa === this.state.etapa) return;
    const escena = this.contenedor.current?.firstElementChild as HTMLElement | null;
    if (!escena) { this.confirmar(); return; }
    escena.inert = true;
    this.salida = gsap.to(escena, {
      paused: true, opacity: 0,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .28,
      ease: 'power1.inOut',
      onComplete: () => this.confirmar(),
    });
    this.salida.play();
  }

  // Sólo después del fundido se desmonta la escena; el fondo persistente queda expuesto.
  private confirmar = () => {
    this.salida = undefined;
    // Volver al origen durante la salida también restaura su interacción y opacidad.
    if (this.state.etapa === this.props.etapa) {
      const escena = this.contenedor.current?.firstElementChild as HTMLElement | null;
      if (escena) { gsap.set(escena, { clearProps: 'opacity' }); escena.inert = false; }
    }
    this.setState({ etapa: this.props.etapa, contenido: this.props.children });
  };

  componentWillUnmount() { this.salida?.kill(); }

  render() {
    return <div key={this.state.etapa} ref={this.contenedor} className="contents">{this.state.contenido}</div>;
  }
}
