import { useEffect, useRef, useState } from "react";
import { usePlayerEconomy } from "../../../context/PlayerEconomyContext";
import { limpiarTodasLasSesiones } from "../../AUTH/authUtils";
import type { AppNavbarProps, NavbarSession, Usuario } from "./navbar.types";

/** Lee la sesión guardada; datos incompletos o JSON corrupto vuelven al estado invitado. */
export function readNavbarUser(): Usuario | null {
  try {
    const saved =
      localStorage.getItem("usuario") || localStorage.getItem("user");
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    return parsed &&
      typeof parsed === "object" &&
      "name" in parsed &&
      typeof parsed.name === "string"
      ? (parsed as Usuario)
      : null;
  } catch {
    return null;
  }
}

/** Centraliza acceso, cierre y sincronización de sesión para los tres contextos visuales. */
export function useNavbarSession(
  onUsuarioChange: AppNavbarProps["onUsuarioChange"],
) {
  const economy = usePlayerEconomy();
  const [user, setUser] = useState(readNavbarUser);
  const [authOpen, setAuthOpen] = useState(false);
  const notifyRef = useRef(onUsuarioChange);

  // El callback más reciente no obliga a volver a suscribir eventos del navegador.
  useEffect(() => {
    notifyRef.current = onUsuarioChange;
  }, [onUsuarioChange]);
  useEffect(() => {
    notifyRef.current?.(user);
  }, [user]);

  // El parámetro de enlace se consume una sola vez; se preservan consulta y fragmento restantes.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("abrirLogin") !== "true") return;
    setAuthOpen(true);
    url.searchParams.delete("abrirLogin");
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  // Cambios de progreso en esta pestaña y cambios de almacenamiento en otras usan la misma lectura.
  useEffect(() => {
    const synchronize = () => setUser(readNavbarUser());
    window.addEventListener("user_progress_updated", synchronize);
    window.addEventListener("storage", synchronize);
    return () => {
      window.removeEventListener("user_progress_updated", synchronize);
      window.removeEventListener("storage", synchronize);
    };
  }, []);

  /** El modal ya persistió las credenciales; aquí solo actualizamos UI y economía. */
  const login = (loggedUser: Usuario) => {
    setUser(loggedUser);
    setAuthOpen(false);
    void economy.recargarEconomia();
  };

  /** Usa la limpieza compartida para cerrar también las sesiones de operador. */
  const logout = () => {
    limpiarTodasLasSesiones();
    setUser(null);
    setAuthOpen(false);
    void economy.recargarEconomia();
  };

  const session: NavbarSession = user
    ? { kind: "authenticated", user }
    : { kind: "guest", user: null };
  return {
    session,
    economy,
    authOpen,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
    login,
    logout,
  };
}
