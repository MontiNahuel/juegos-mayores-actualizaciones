// Presenta el evento como una escena: ilustracion, titulo y decisiones al pie.
import { useState } from 'react';
import type { EventoApi } from '../narrativeService';
import TituloNarrativo from '../COMPARTIDOS/TituloNarrativo';
import BotonDecision from '../COMPARTIDOS/BotonDecision';
import '../COMPARTIDOS/fadeNarrativo.css';
import './evento.css';

const FONDO_DEFAULT = '/assets/narrative/court.jpg';
const imagenDe = (imagen: string) => imagen.startsWith('/') && !imagen.startsWith('/assets/') && !imagen.startsWith('//')
  ? `http://10.16.2.19:8080${imagen}` : imagen;

export default function ResolverEventoEtapa2({ evento, atributos, onElegir }: {
  evento: EventoApi;
  atributos: Record<string, number>;
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
            <details className="evento-recursos">
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
            </details>
          </div>
          <div className="evento-opciones">
            {evento.opciones.filter(opcion => !opcion.bloqueada).map(opcion => (
              <BotonDecision key={opcion.id} onClick={() => onElegir(opcion.id)}>{opcion.texto}</BotonDecision>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
