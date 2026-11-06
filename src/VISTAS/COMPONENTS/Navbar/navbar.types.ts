import type { ReactNode } from "react";

/** Datos mínimos de la sesión que utiliza la navbar y devuelve el modal de acceso. */
export interface Usuario {
  /** Identificador que entrega el acceso a la cuenta. */
  id: number;
  /** Nombre visible del jugador. */
  name: string;
  /** Datos opcionales utilizados por el flujo de autenticación. */
  email?: string;
  codigoAcceso?: string;
  /** Progreso persistido; el saldo visible se obtiene del contexto de economía. */
  racha?: number;
  puntos?: number;
  vidas?: number;
  /** Alias de rol que pueden devolver las distintas versiones del servidor. */
  tipoUsuario?: number;
  tipo_usuario?: number;
  rol?: number;
}

/** El contexto de navegación define qué información y acciones corresponden a cada pantalla. */
export type NavbarView =
  | { kind: "menu" }
  | {
      kind: "calendar";
      /** Nombre del juego al que pertenece el calendario. */
      title: string;
      /** Acción de regreso definida por la pantalla, sin modificar el historial aquí. */
      onBack: () => void;
    }
  | {
      kind: "game";
      /** Título del juego o del resultado. */
      title: string;
      /** Regreso al calendario o cierre del resultado. */
      onBack: () => void;
      /** Vidas, dificultad y demás indicadores aportados por el juego. */
      details?: ReactNode;
      /** Pistas y acciones específicas del juego. */
      rightAction?: ReactNode;
      /** Puntos confirmados que debe animar la insignia del resultado. */
      pointsEarned?: number;
    };

/** Una sola navbar recibe un contexto explícito y notifica cambios de sesión al consumidor. */
export interface AppNavbarProps {
  view: NavbarView;
  onUsuarioChange?: (user: Usuario | null) => void;
}

/** Estado discriminado: evita tratar como autenticado a un usuario inexistente. */
export type NavbarSession =
  { kind: "guest"; user: null } | { kind: "authenticated"; user: Usuario };
