import { API_URL } from '../config/api';

export interface SolicitudPista {
  game_id: 'wordle' | 'sudoku' | 'sopa_letras' | 'crucigrama';
  date?: string;
  hint_index?: number;
  row?: number;
  col?: number;
}

export interface RespuestaPista {
  success: true;
  vidas_restantes: number;
  vidas_descontadas: number;
  pista: string | null;
  valor_revelado: string | number | null;
  message?: string;
}

export class ErrorPista extends Error {
  constructor(public status: number, mensaje: string) { super(mensaje); }
}

export async function pedirPistaConVida(solicitud: SolicitudPista): Promise<RespuestaPista> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) throw new ErrorPista(401, 'Iniciá sesión para comprar una pista.');
  const respuesta = await fetch(`${API_URL}/api/economy/use-hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(solicitud),
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorPista(respuesta.status, datos?.detail || 'No se pudo solicitar la pista.');
  if (!datos?.success || !Number.isFinite(datos.vidas_restantes)) {
    throw new Error('No se pudo confirmar la compra de la pista.');
  }
  return datos;
}
