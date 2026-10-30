/* Presenta el comienzo del evento antes de pasar a sus decisiones. */
import type { CSSProperties } from 'react';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import TituloConversacion from '../COMPARTIDOS/TITULO_NARRATIVO/TituloConversacion';
import { calcularTituloCiclo } from './cicloEvento';
import './muestraEvento.css';
import { imagenPrecargada } from '../../../../services/assetPreloader';

// ETAPA 0: anticipa el tono del día antes de formar la corte.
export default function MuestraEventoEtapa0({ eventos, onContinuar }: { eventos: any[]; onContinuar: () => void }) {
  const titulo = calcularTituloCiclo(eventos);
  const cantidad = Math.max(6, Math.min(eventos.length || 0, 16));
  const muestra = eventos.find(/* Busca el primer elemento que cumple esta condición. */ (evento) => evento?.titulo || evento?.nombre) || {};

  return (
    <section className="muestra-evento" aria-label="Muestra de eventos" style={{ '--marco-carta': `url("${imagenPrecargada('/assets/narrative/card-frame.png')}")` } as CSSProperties}>
      <TituloConversacion titulo={titulo} />
      <div className="muestra-evento__barajado">
          <div className="muestra-evento__mazo" role="group" aria-label={`${cantidad} cartas de evento barajándose`}>
            {Array.from({ length: cantidad }, /* Completa este paso con los datos recibidos por la operación. */ (_, indice) => {
              const izquierda = indice < cantidad / 2;
              const estilo = {
                '--indice': indice,
                '--salida': izquierda ? '-105px' : '105px',
                '--rebote': izquierda ? '21px' : '-21px',
                '--giro': `${izquierda ? -12 - indice : 12 + indice}deg`,
                '--giro-retorno': `${izquierda ? 3 : -3}deg`,
              } as CSSProperties;
              return <span aria-hidden="true" className="muestra-evento__carta" key={indice} style={estilo} />;
            })}
            <article className="muestra-evento__seleccionada" aria-label="Ejemplo de carta de evento">
              <div className="muestra-evento__seleccionada-interior">
                <span className="muestra-evento__seleccionada-dorso" />
                <span className="muestra-evento__seleccionada-frente">
                  <small>{muestra.categoria_evento || muestra.categoria || 'Evento'}</small>
                  <strong>{muestra.titulo || muestra.nombre || 'El próximo acontecimiento'}</strong>
                  {muestra.descripcion ? <span>{muestra.descripcion}</span> : null}
                </span>
              </div>
            </article>
          </div>

          <h2 className="sr-only">{titulo}</h2>
          <p className="muestra-evento__mensaje">Las cartas del día están listas.</p>
          <div className="muestra-evento__acciones">
            <BotonNarrativo onClick={onContinuar}>Continuar</BotonNarrativo>
          </div>
      </div>
    </section>
  );
}
