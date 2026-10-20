// Muestra el resultado de una decision o el cierre de la partida.
import type { FinalizacionApi, ResultadoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import PapelUi from '../COMPARTIDOS/PAPEL_UI/PapelUi';
import './resultado.css';

// ETAPA 4: muestra el resultado del evento o el cierre de la partida.
export default function MostrarResultadoEtapa4({ resultado, finalizacion, efectoTexto, onContinuar, onVerEstadisticas, cargandoEstadisticas, onTerminar, reiniciando }: {
  resultado?: ResultadoApi;
  finalizacion?: FinalizacionApi;
  efectoTexto?: string;
  onContinuar?: () => void;
  onVerEstadisticas?: () => void;
  cargandoEstadisticas?: boolean;
  onTerminar?: () => void;
  reiniciando?: boolean;
}) {
  const esFinal = Boolean(finalizacion);
  const contenido = finalizacion || resultado;

  if (!contenido) return null;

  const tipo = finalizacion
    ? finalizacion.tipo === 'victoria_tiempo' ? 'positivo' : 'negativo'
    : resultado?.tipo_resultado || 'neutro';
  const efecto = efectoTexto || (finalizacion
    ? finalizacion.rango ? `Rango final: ${finalizacion.rango}` : 'Partida finalizada'
    : resultado?.efectos.map(({ accion }) => `${accion.valor > 0 ? '+' : ''}${accion.valor} ${accion.clave}`).join(', ') || 'Sin cambios');

  return (
    <section className="resultado-etapa">
      <TituloNarrativo titulo="Resultado" permanente variante="evento" />

      <PapelUi className="resultado-pergamino" contenidoClassName="resultado-pergamino__contenido">
          <article>
            <h3>{contenido.titulo}</h3>
            <p className="resultado-pergamino__relato">{contenido.texto}</p>
            <p className="resultado-pergamino__efecto" data-tipo={tipo}>{efecto}</p>
          </article>
      </PapelUi>

      <div className="resultado-etapa__acciones">
        {onContinuar && <BotonNarrativo onClick={onContinuar}>Continuar</BotonNarrativo>}
        {onVerEstadisticas && <BotonNarrativo disabled={cargandoEstadisticas} onClick={onVerEstadisticas}>{cargandoEstadisticas ? 'Cargando estadisticas...' : 'Ver estadisticas'}</BotonNarrativo>}
        {esFinal && onTerminar && <BotonNarrativo disabled={reiniciando} onClick={onTerminar}>{reiniciando ? 'Reiniciando...' : 'Terminar prueba'}</BotonNarrativo>}
      </div>
    </section>
  );
}
