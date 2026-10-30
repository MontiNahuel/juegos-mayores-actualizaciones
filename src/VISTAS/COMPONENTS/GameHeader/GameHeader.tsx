/* Muestra el encabezado del juego con las vidas y sus acciones. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from '../../LOGIN/LoginHeader';
import { HintButton } from './HintButton';

export interface GameHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  onBack?: () => void;
  backRoute?: string;
  backLabel?: string;
  rightAction?: React.ReactNode;
  onHint?: () => void;
  hintDisabled?: boolean;
}

// Muestra el encabezado del juego con las vidas y sus acciones.
export function GameHeader({ title, subtitle, badges, onBack, backRoute, rightAction, onHint, hintDisabled }: GameHeaderProps) {
  const navigate = useNavigate();
  const volver = onBack ?? (/* Completa este paso con los datos recibidos por la operación. */ () => backRoute ? navigate(backRoute) : navigate(-1));
  return <LoginHeader
    title={title}
    onBack={volver}
    gameDetails={<>{subtitle}{badges}</>}
    rightAction={<>{rightAction}{onHint && <HintButton onClick={onHint} disabled={hintDisabled} />}</>}
    ocultarSesion
  />;
}

export default GameHeader;
