/* Adaptador de contexto del juego; AppNavbar es la única navbar visual. */
import React from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../Navbar/AppNavbar";
import { HintButton } from "./HintButton";

/** Datos que el juego aporta al contexto común, sin mantener estado propio de navbar. */
export interface GameHeaderProps {
  /** Nombre visible del juego o del resultado. */
  title: string;
  /** Indicadores ya construidos por cada juego (dificultad, vidas y similares). */
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  /** Callback explícito de regreso, con prioridad sobre la ruta y el historial. */
  onBack?: () => void;
  backRoute?: string;
  backLabel?: string;
  /** Acciones adicionales que se integran junto al acceso a pistas. */
  rightAction?: React.ReactNode;
  onHint?: () => void;
  hintDisabled?: boolean;
  /** Acreditación confirmada que anima el saldo al mostrar un resultado. */
  pointsEarned?: number;
}

// Muestra el encabezado del juego con las vidas y sus acciones.
export function GameHeader({
  title,
  subtitle,
  badges,
  onBack,
  backRoute,
  rightAction,
  onHint,
  hintDisabled,
  pointsEarned,
}: GameHeaderProps) {
  const navigate = useNavigate();
  const volver =
    onBack ??
    /* Completa este paso con los datos recibidos por la operación. */ (() =>
      backRoute ? navigate(backRoute) : navigate(-1));
  // Adaptador de las props históricas del juego: toda la estructura visual vive en AppNavbar.
  return (
    <AppNavbar
      view={{
        kind: "game",
        title,
        onBack: volver,
        details: (
          <>
            {subtitle}
            {badges}
          </>
        ),
        pointsEarned,
        rightAction: (
          <>
            {rightAction}
            {onHint && <HintButton onClick={onHint} disabled={hintDisabled} />}
          </>
        ),
      }}
    />
  );
}

export default GameHeader;
