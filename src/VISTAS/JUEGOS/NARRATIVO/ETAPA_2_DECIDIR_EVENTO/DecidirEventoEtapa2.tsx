// Presenta el evento como una escena: ilustracion, titulo y decisiones al pie.
import { useState } from 'react';
import type { EventoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TITULO_NARRATIVO/TituloNarrativo';
import { API_URL } from '../../../../config/api';
import { ocultarCambiosNumericos } from '../../../../config/adaptacionEdad';
import BotonNarrativo from '../COMPARTIDOS/BOTON_NARRATIVO/BotonNarrativo';
import '../COMPARTIDOS/TRANSICION_NARRATIVA/fadeNarrativo.css';
import './evento.css';

const FONDO_DEFAULT = '/assets/narrative/court.jpg';
const imagenDe = (imagen: string) => imagen.startsWith('/') && !imagen.startsWith('/assets/') && !imagen.startsWith('//')
  ? `${API_URL}${imagen}` : imagen;

export default function ResolverEventoEtapa2({ evento, atributos, modoSimple = false, onElegir }: {
  evento: EventoApi;
  atributos: Record<string, number>;
  modoSimple?: boolean;
  onElegir: (opcionId: string) => void;
}) {
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  const [fondoListo, setFondoListo] = useState<string | null>(null);
  const fondo = evento.imagen && evento.imagen !== imagenFallida ? imagenDe(evento.imagen) : FONDO_DEFAULT;

  return (
    <section className="evento-escena" aria-label="Evento del reino">
      <img
        key={fondo}
        className="evento-fondo"
        src={fondo}
        alt=""
        onLoad={() => setFondoListo(fondo)}
        onError={() => {
          if (fondo !== FONDO_DEFAULT) setImagenFallida(evento.imagen);
          else setFondoListo(fondo);
        }}
      />
      <TituloNarrativo key={evento.id} titulo={evento.titulo} listo={fondoListo === fondo} variante="evento" permanente />
      <div className="evento-ilustracion" aria-hidden="true" />
      {/* El panel conserva su altura durante la introduccion para no mover el fondo. */}
      <div className="evento-dialogo narrativo-fade-dialogo" data-intro={fondoListo === fondo ? 'listo' : 'cargando'}>
        <div className="evento-dialogo__interior">
          <div className="evento-dialogo__cabecera">
            <p className="evento-descripcion">{evento.descripcion}</p>
            {!modoSimple ? <details className="evento-recursos">
              <summary>Recursos del reino</summary>
              <div className="evento-recursos__lista">
                {Object.entries(atributos).map(([clave, valor]) => (
                  <div key={clave}>
                    <span className="capitalize">{clave}</span>
                    <strong>{valor}/100</strong>
                    <progress value={valor} max={100} aria-label={clave} />
                  </div>
                ))}
              </div>
            </details> : null}
          </div>
          <div className="evento-opciones">
            {evento.opciones.filter(opcion => !opcion.bloqueada).map(opcion => (
              <BotonNarrativo className="boton-narrativo--decision" key={opcion.id} onClick={() => onElegir(opcion.id)}>{modoSimple ? ocultarCambiosNumericos(opcion.texto) : opcion.texto}</BotonNarrativo>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
