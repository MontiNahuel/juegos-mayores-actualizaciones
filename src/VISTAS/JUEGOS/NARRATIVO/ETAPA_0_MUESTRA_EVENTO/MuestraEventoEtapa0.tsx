/* Presenta el comienzo del evento antes de pasar a sus decisiones. */
import type { SetupPartida } from '../narrativeTypes';
import type { CSSProperties } from 'react';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import './muestraEvento.css';
import { imagenPrecargada } from '../../../../services/assetPreloader';

// ETAPA 0: anticipa el tono del día antes de formar la corte.
export default function MuestraEventoEtapa0({ eventos, onContinuar }: { eventos: NonNullable<SetupPartida['eventos_del_dia']>; onContinuar: () => void }) {
  const titulo = calcularTituloCiclo(eventos);
  const cantidad = Math.max(6, Math.min(eventos.length || 0, 16));
  const muestra = eventos.find((evento) => evento?.titulo || evento?.nombre) || {};

  return (
    <section className="muestra-evento" aria-label="Muestra de eventos" style={{ '--marco-carta': `url("${imagenPrecargada('/assets/narrative/card-frame.png')}")` } as CSSProperties}>
      <TituloNarrativo variante="conversacion" titulo={titulo} />
      <div className="muestra-evento__barajado">
          <div className="muestra-evento__mazo" role="group" aria-label={`${cantidad} cartas de evento barajándose`}>
            {Array.from({ length: cantidad }, (_, indice) => {
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

const TONOS_POSITIVOS = new Set(['positivo', 'positiva', 'bueno', 'buena', 'soleado', 'soleada']);
const TONOS_NEGATIVOS = new Set(['negativo', 'negativa', 'malo', 'mala', 'tormentoso', 'tormentosa']);

// Deja el texto en un formato parejo para compararlo.
const normalizar = (valor: unknown) => String(valor || '').trim().toLocaleLowerCase('es');

// Resume las cartas del día sin exigir un formato nuevo al backend.
function calcularTituloCiclo(eventos: NonNullable<SetupPartida['eventos_del_dia']> = []) {
  const categorias = new Map<string, { nombre: string; cantidad: number }>();
  let positivos = 0;
  let negativos = 0;

  eventos.forEach((evento) => {
    const nombreCategoria = String(evento?.categoria_evento || evento?.categoria || '').trim();
    const categoria = normalizar(nombreCategoria);
    const tono = normalizar(evento.tono);

    if (TONOS_POSITIVOS.has(tono)) positivos += 1;
    if (TONOS_NEGATIVOS.has(tono)) negativos += 1;

    // Bueno/malo describen el clima del ciclo, no su tema.
    if (categoria && !TONOS_POSITIVOS.has(categoria) && !TONOS_NEGATIVOS.has(categoria)) {
      const actual = categorias.get(categoria);
      categorias.set(categoria, { nombre: nombreCategoria, cantidad: (actual?.cantidad || 0) + 1 });
    }
  });

  const ordenadas = [...categorias.values()].sort((a, b) => b.cantidad - a.cantidad);
  if (ordenadas[0] && ordenadas[0].cantidad > (ordenadas[1]?.cantidad || 0)) return `Ciclo de ${ordenadas[0].nombre}`;
  if (positivos > negativos) return 'Ciclo soleado';
  if (negativos > positivos) return 'Ciclo tormentoso';
  if (positivos > 0) return 'Ciclo balanceado';
  return 'Ciclo del Bufón';
}
