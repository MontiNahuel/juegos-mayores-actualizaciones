import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import FondoCorte from '../COMPARTIDOS/FONDO_CORTE/FondoCorte';
import { componerFondo, CORTE_VACIA, type EstadoFondoCorte } from '../../../../config/fondoCorte';
import { precargarImagenes } from '../../../../services/assetPreloader';
import type { EstadoPartida } from '../narrativeTypes';

interface PropsTransicion {
  etapa: string;
  recursos: EstadoPartida['recursos'];
  hayResultado: boolean;
  mostrarCorte: boolean;
  sinTinte: boolean;
  children: ReactNode;
}

type Fase = 'visible' | 'salida' | 'fondo';
const piezas = (fondo: EstadoFondoCorte) => [...fondo.personajes, ...fondo.oro, ...fondo.manos];
const duracion = (segundos: number) =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : segundos;

// Conserva la escena anterior mientras se presenta el fondo de la corte.
export function TransicionCorte(props: PropsTransicion) {
  const escena = useRef<HTMLDivElement>(null);
  const corte = useRef<HTMLDivElement>(null);
  const ultimo = useRef(props);
  const resultado = useRef(props.hayResultado);
  const recursosDelResultado = useRef(props.recursos);
  const mostrarResultado = useRef(false);
  ultimo.current = props;
  const [etapaVisible, setEtapaVisible] = useState(props.etapa);
  const [contenido, setContenido] = useState(props.children);
  const [fondo, setFondo] = useState(() => componerFondo(props.recursos));
  const [fondoAnterior, setFondoAnterior] = useState(fondo);
  const [fase, setFase] = useState<Fase>('visible');
  const recursosAplicados = useRef(props.recursos);
  if (props.hayResultado && props.etapa === etapaVisible) {
    resultado.current = true;
    recursosDelResultado.current = props.recursos;
  }

  // Durante una transición se conserva el contenido anterior hasta que termine su fade.
  useLayoutEffect(() => {
    if (fase === 'visible') {
      if (etapaVisible !== props.etapa) setFase('salida');
      else setContenido(props.children);
    }
  }, [props.etapa, props.children, fase, etapaVisible]);

  // Al restaurar se compone la corte; durante el resultado conserva su aspecto anterior.
  useLayoutEffect(() => {
    if (fase !== 'visible' || etapaVisible !== props.etapa || recursosAplicados.current === props.recursos) return;
    if (!recursosAplicados.current && props.recursos) {
      const inicial = componerFondo(props.recursos);
      recursosAplicados.current = props.recursos;
      setFondo(inicial);
      setFondoAnterior(inicial);
    } else if (!props.hayResultado) {
      recursosAplicados.current = props.recursos;
      setFondoAnterior(fondo);
      setFondo(componerFondo(props.recursos, fondo));
      setFase('fondo');
    }
  }, [props.recursos, props.hayResultado, props.etapa, etapaVisible, fase, fondo]);

  useLayoutEffect(() => {
    if (fase !== 'salida') return;
    const elemento = escena.current?.firstElementChild as HTMLElement | null;
    const animaciones = elemento?.getAnimations?.({ subtree: true })
      .filter(animacion => animacion.playState === 'running') ?? [];
    const tweens = elemento ? gsap.getTweensOf([elemento, ...elemento.querySelectorAll('*')])
      .filter(tween => !tween.paused()) : [];
    animaciones.forEach(animacion => animacion.pause());
    tweens.forEach(tween => tween.pause());
    if (elemento) elemento.inert = true;

    let cancelado = false;
    const presentarSiguiente = () => {
      setEtapaVisible(ultimo.current.etapa);
      setContenido(ultimo.current.children);
      setFase('visible');
      const scroll = escena.current?.closest('ion-content')?.shadowRoot?.querySelector<HTMLElement>('.inner-scroll');
      if (scroll) scroll.scrollTop = 0;
    };
    const terminar = async () => {
      if (ultimo.current.etapa === etapaVisible) {
        if (elemento) { gsap.set(elemento, { clearProps: 'opacity' }); elemento.inert = false; }
        animaciones.forEach(animacion => animacion.play());
        tweens.forEach(tween => tween.resume());
        setFase('visible');
        return;
      }
      if (resultado.current) {
        const siguiente = componerFondo(recursosDelResultado.current, fondo);
        const anteriores = piezas(fondo);
        const siguientes = piezas(siguiente);
        const entradas = siguientes.filter(pieza => !anteriores.includes(pieza));
        const cambio = entradas.length > 0 || anteriores.some(pieza => !siguientes.includes(pieza));
        if (cambio) {
          await precargarImagenes(entradas.map(pieza => pieza.src));
          if (cancelado) return;
          recursosAplicados.current = recursosDelResultado.current;
          mostrarResultado.current = true;
          resultado.current = false;
          setContenido(null);
          setFondoAnterior(fondo);
          setFondo(siguiente);
          setFase('fondo');
          return;
        }
        resultado.current = false;
      }
      presentarSiguiente();
    };
    if (!elemento) { void terminar(); return; }
    const salida = gsap.to(elemento, { opacity: 0, duration: duracion(.28), ease: 'power1.inOut', onComplete: () => { void terminar(); } });
    return () => { cancelado = true; salida.kill(); };
  }, [fase, etapaVisible, fondo]);

  useLayoutEffect(() => {
    if (fase !== 'fondo') return;
    const entradas = corte.current?.querySelectorAll('[data-adorno="entrada"]');
    const salidas = corte.current?.querySelectorAll('[data-adorno="salida"]');
    const imagen = corte.current?.querySelector('[data-fondo-imagen]');
    const duracionFondo = duracion(1.4);
    const secuencia = gsap.timeline({ paused: true, onComplete: () => {
      setFondoAnterior(fondo);
      if (mostrarResultado.current) {
        mostrarResultado.current = false;
        setEtapaVisible(ultimo.current.etapa);
        setContenido(ultimo.current.children);
      }
      setFase('visible');
    } });
    if (entradas?.length) secuencia.fromTo(entradas, { opacity: 0 }, { opacity: 1, duration: duracionFondo, ease: 'power2.inOut' }, 0);
    if (salidas?.length) secuencia.to(salidas, { opacity: 0, duration: duracionFondo, ease: 'power2.inOut' }, 0);
    if (imagen && mostrarResultado.current && duracionFondo) {
      secuencia.fromTo(imagen, { filter: 'brightness(1)' }, { filter: 'brightness(1.16)', duration: .6 }, 0)
        .to(imagen, { filter: 'brightness(1)', duration: .8, clearProps: 'filter' }, .6);
    }
    if (!secuencia.duration()) {
      if (entradas?.length) gsap.set(entradas, { opacity: 1 });
      secuencia.eventCallback('onComplete')?.();
    } else secuencia.play();
    return () => { secuencia.kill(); if (imagen) gsap.set(imagen, { clearProps: 'filter' }); };
  }, [fase, fondo]);

  const sinTinte = props.sinTinte || fase === 'fondo' && mostrarResultado.current;
  const tinteAnterior = useRef(sinTinte);
  useLayoutEffect(() => {
    const tinte = corte.current?.querySelector('[data-fondo-tinte]');
    if (!tinte) return;
    const animacion = gsap.fromTo(tinte, { opacity: tinteAnterior.current ? 0 : 1 }, {
      opacity: sinTinte ? 0 : 1, duration: duracion(.75), overwrite: true,
    });
    tinteAnterior.current = sinTinte;
    return () => { animacion.kill(); };
  }, [sinTinte]);

  return <div className="contents">
    <FondoCorte ref={corte} fondo={props.mostrarCorte ? fondo : CORTE_VACIA}
      fondoAnterior={props.mostrarCorte ? fondoAnterior : CORTE_VACIA} atenuado sinTinte={sinTinte} fijo />
    <div key={etapaVisible} ref={escena} className="contents">{contenido}</div>
  </div>;
}
