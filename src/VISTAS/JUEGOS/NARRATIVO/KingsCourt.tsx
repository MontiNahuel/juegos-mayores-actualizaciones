/* Obtiene la partida del backend y entrega sus datos y acciones a la etapa visible. */
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { configuracionPorEdad, guardarEdad, leerEdad } from '../../../config/adaptacionEdad';
import { CORTE_VACIA } from '../../../config/fondoCorte';
import { imagenPrecargada } from '../../../services/assetPreloader';
import type { PersonajeApi, SetupPartida } from './narrativeTypes';
import { usePartidaNarrativa } from './kingscourtcoord/usePartidaNarrativa';
import { TransicionCorte } from './kingscourtcoord/transicionCorte';
import BotonNarrativo from './COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import MazoUi from './COMPARTIDOS/MAZO_UI/MazoUi';
import ConfiguracionEdad from './COMPARTIDOS/CONFIGURACION_EDAD/ConfiguracionEdad';
import CargaNarrativa from './COMPARTIDOS/CARGA_NARRATIVA/CargaNarrativa';
import SeleccionarCartas from './ETAPA_0_1_SELECCIONAR_CARTAS/SeleccionarCartasEtapa0y1';
import MuestraEvento from './ETAPA_0_MUESTRA_EVENTO/MuestraEventoEtapa0';
import Evento from './ETAPA_2_DECIDIR_EVENTO/DecidirEventoEtapa2';
import Conversacion from './ETAPA_3_RESPONDER_CONVERSACION/ResponderConversacionEtapa3';
import Resultado from './ETAPA_4_MOSTRAR_RESULTADO/MostrarResultadoEtapa4';
import Estadisticas from './ETAPA_5_ESTADISTICAS_PARTIDA/EstadisticasPartidaEtapa5';
import './narrativo.css';

// Cada fecha monta su propio gestor y descarta las respuestas de la visita anterior.
export default function KingsCourt() {
  const ubicacion = useLocation().state as { challenge?: { dateKey?: string } } | null;
  const date = ubicacion?.challenge?.dateKey || new Date().toISOString().slice(0, 10);
  return <Partida key={date} date={date} />;
}

// El gestor elige la etapa visible y conecta las intenciones del jugador con la partida.
function Partida({ date }: { date: string }) {
  const navigate = useNavigate();
  const {
    setup, estado, personajes, setPersonajes, cartas, ocupado, error, porcentaje, estadisticas,
    esDraft, grafo, idEscena, hayResultado,
    abrirEstadisticas, cerrarEstadisticas, continuar, responder, recargarEstado,
    reiniciar, comenzarPartida, confirmarCartaMensual, reintentarCarga,
  } = usePartidaNarrativa(date);
  const [preparacion, setPreparacion] = useState<'muestra' | 'corte' | 'cartas'>('muestra');
  const [edad, setEdad] = useState(leerEdad);
  const [mostrarCarga, setMostrarCarga] = useState(true);
  const config = configuracionPorEdad(edad);
  const finalizacion = estado.finalizacion ?? grafo?.finalizacion;
  const salir = () => reiniciar(() => navigate('/juegos/kings-court', { replace: true }));
  // La edad ajusta únicamente la legibilidad del texto.
  const cambiarEdad = (valor: number) => {
    guardarEdad(valor);
    setEdad(valor);
  };
  // La corte aún es una elección local: se envía junto con las cartas iniciales.
  const confirmarCorte = (seleccion: PersonajeApi[]) => {
    setPersonajes(seleccion);
    setPreparacion('cartas');
  };
  // Retira la carga cuando su animación confirma que las imágenes están preparadas.
  const entrar = useCallback(() => setMostrarCarga(false), []);

  // La prioridad evita ocultar un final o un resultado detrás de una escena pendiente.
  // Esta elección sólo decide qué dibujar; no hace avanzar la partida.
  let etapa: string = 'desconocida';
  if (estadisticas) etapa = 'estadisticas';
  else if (finalizacion) etapa = 'final';
  else if (hayResultado) etapa = 'resultado';
  else if (grafo?.tipo === 'conversacion' || estado.conversacion_actual) etapa = 'conversacion';
  else if (grafo || estado.evento_actual) etapa = 'evento';
  else if (esDraft) etapa = 'draft';
  else if (!estado.fase_actual && !setup?.tiene_partida_activa) etapa = preparacion;

  const etapaVisible = `${etapa}:${idEscena || estado.mes_actual || ''}`;
  function renderizarEtapa(setup: SetupPartida): ReactNode {
    switch (etapa) {
      case 'muestra':
        return <MuestraEvento eventos={setup.eventos_del_dia ?? []} onContinuar={() => setPreparacion('corte')} />;
      case 'corte':
        return <SeleccionarCartas key={etapaVisible} enviando={ocupado} titulo="Forma tu corte" descripcion="Elegí tres personajes para comenzar el desafio." cartas={setup.personajes_ofrecidos} cantidad={3}
        onConfirmar={confirmarCorte} />;
      case 'cartas':
      case 'draft':
        return <SeleccionarCartas key={etapaVisible} enviando={ocupado}
          titulo={esDraft ? `Mes ${estado.mes_actual}` : 'Prepara el reino'}
          descripcion={esDraft ? 'Elegí una carta para afrontar el proximo evento.' : 'Elegí tres cartas para comenzar la partida.'}
          cartas={esDraft ? estado.cartas_draft_actual ?? [] : setup.cartas_ofrecidas}
          cantidad={esDraft ? 1 : 3} onConfirmar={esDraft ? confirmarCartaMensual : comenzarPartida} />;
      case 'evento':
        return <Evento key={etapaVisible} evento={estado.evento_actual ?? undefined} grafo={grafo ?? undefined} atributos={estado.recursos ?? {}} fondoBase={CORTE_VACIA}
        enviando={ocupado} onElegir={responder} />;
      case 'conversacion':
        return <Conversacion key={etapaVisible} conversacion={estado.conversacion_actual ?? undefined} grafo={grafo ?? undefined} personajes={personajes}
        enviando={ocupado} onElegir={responder} />;
      case 'resultado':
      case 'final':
        return <Resultado resultado={estado.resultado_actual ?? undefined} grafo={grafo ?? undefined} finalizacion={finalizacion ?? undefined}
        continuando={ocupado} onContinuar={finalizacion ? undefined : continuar} reiniciando={ocupado} onTerminar={salir}
        onVerEstadisticas={finalizacion ? abrirEstadisticas : undefined} />;
      case 'estadisticas':
        return estadisticas?.datos
          ? <Estadisticas {...estadisticas.datos} recursosIniciales={setup.atributos_iniciales} cartas={cartas}
              personajes={personajes} finalizacion={finalizacion} onVolver={cerrarEstadisticas} />
          : <section aria-label="Estadísticas">
              <p role={estadisticas?.error ? 'alert' : 'status'}>{estadisticas?.error || 'Cargando estadísticas...'}</p>
              <BotonNarrativo onClick={cerrarEstadisticas}>Volver al cierre</BotonNarrativo>
            </section>;
      default:
        return <p role="alert">La fase {estado.fase_actual} no tiene contenido para mostrar. Volvé a intentar o salí de prueba.
        <BotonNarrativo disabled={ocupado} onClick={recargarEstado}>Volver a intentar</BotonNarrativo></p>;
    }
  }

  const enConversacion = etapa === 'conversacion';
  const enEvento = etapa === 'evento';
  const mostrarCorte = !mostrarCarga && !['muestra', 'corte', 'cartas'].includes(etapa);
  const estiloEdad = {
    '--narrativo-texto-adaptado': `${config.tamanioTexto}px`, '--narrativo-control-adaptado': `${config.altoControl}px`,
    '--narrativo-personaje-visible-svh': `${70 * config.fraccionVisiblePersonaje}svh`,
    '--narrativo-personaje-visible-rem': `${32 * config.fraccionVisiblePersonaje}rem`,
  } as CSSProperties;
  const tipoEscena = enConversacion ? 'conversacion' : enEvento ? 'evento' : 'general';

  return <IonPage><IonContent scrollY={!enConversacion} className="narrativo-contenido" style={{ '--narrativo-fondo-base': `url("${imagenPrecargada(CORTE_VACIA.src)}")` } as CSSProperties}>
    <TransicionCorte etapa={mostrarCarga || !setup ? 'carga' : etapaVisible} recursos={estado.recursos} hayResultado={hayResultado} mostrarCorte={mostrarCorte} sinTinte={enEvento}>
    {mostrarCarga || !setup ? <CargaNarrativa porcentaje={porcentaje} listo={porcentaje === 100} mensaje={porcentaje ? 'Preparando personajes y escenarios…' : 'Reuniendo las historias del reino…'}
      error={error} onReintentar={reintentarCarga} onEntrar={entrar} />
      : <main style={config.adaptado ? estiloEdad : undefined} className={`narrativo-escena narrativo-${tipoEscena}${config.adaptado ? ' narrativo-modo-mayor' : ''}`}>
          {error && <p role="alert" className="relative z-50 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">{error}</p>}
          <div className={`narrativo-herramientas narrativo-herramientas--${tipoEscena}`}>
            <MazoUi cartas={cartas} personajes={personajes} />
            <ConfiguracionEdad edad={edad} onGuardar={cambiarEdad} />
            {!finalizacion && <BotonNarrativo disabled={ocupado} onClick={salir}>{ocupado ? 'Esperando...' : 'Salir de prueba'}</BotonNarrativo>}
          </div>
          {renderizarEtapa(setup)}
        </main>}
    </TransicionCorte>
  </IonContent></IonPage>;
}
