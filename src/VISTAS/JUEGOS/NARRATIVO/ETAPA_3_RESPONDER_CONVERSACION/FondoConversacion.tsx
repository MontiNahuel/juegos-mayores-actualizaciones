import { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  imagen: string;
  respaldo: string;
  onListo: () => void;
  animar: (imagen: HTMLImageElement, confirmar: () => void) => void;
  cancelar: () => void;
}

// Conserva la imagen visible hasta que cargue la siguiente. Las claves por URL
// mantienen el mismo <img> al convertir la capa entrante en la capa de salida.
export default function FondoConversacion({ imagen, respaldo, onListo, animar, cancelar }: Props) {
  const [visible, setVisible] = useState<string | null>(null);
  const [lista, setLista] = useState<string | null>(null);
  const [fallida, setFallida] = useState<string | null>(null);
  const solicitada = imagen && imagen !== fallida ? imagen : respaldo;
  const solicitudActual = useRef(solicitada);
  // Cancela la finalización de un recurso reemplazado, incluso si todavía no cargó el nuevo.
  useLayoutEffect(() => {
    solicitudActual.current = solicitada;
    return cancelar;
  }, [solicitada, cancelar]);
  const capas = [...new Set([visible, solicitada].filter((src): src is string => Boolean(src)))];

  return <>{capas.map(src => (
    <img
      key={src}
      className="conversacion-fondo absolute inset-0 -z-20 h-full w-full object-cover"
      src={src}
      alt=""
      decoding="sync"
      data-visible={src === visible || src === lista}
      data-entrando={src === solicitada && src === lista && src !== visible}
      onLoad={evento => {
        // Una carga anterior no puede confirmar el fondo de un nodo más reciente.
        if (src !== solicitada) return;
        setLista(src);
        onListo();
        animar(evento.currentTarget, () => {
          if (solicitudActual.current === src) setVisible(src);
        });
      }}
      onError={() => {
        if (src !== solicitada) return;
        if (src !== respaldo) setFallida(imagen);
        else onListo(); // El relato sigue disponible incluso si falla el respaldo.
      }}
    />
  ))}</>;
}
