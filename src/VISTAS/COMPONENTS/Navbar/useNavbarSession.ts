import { useEffect, useRef, useState } from "react";
import { usePlayerEconomy } from "../../../context/PlayerEconomyContext";
import {
  getSessionUser,
  logoutAuthSession,
  setSessionUser,
  subscribeSessionUser,
} from "../../AUTH/sessionStore";
import type { AppNavbarProps, NavbarSession, Usuario } from "./navbar.types";

/** Lee la sesión activa en memoria sin consultar localStorage. */
export function readNavbarUser(): Usuario | null {
  const user = getSessionUser();
  return user && typeof user.name === "string" ? (user as Usuario) : null;
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

  // Sincroniza la UI ante cambios de sesión en memoria (cookie HttpOnly / login / logout / 401).
  useEffect(() => {
    setUser(readNavbarUser());
    return subscribeSessionUser(() => setUser(readNavbarUser()));
  }, []);

  /** La cookie HttpOnly ya quedó guardada; aquí actualizamos sesión en memoria y economía. */
  const login = (loggedUser: Usuario) => {
    setSessionUser(loggedUser);
    setUser(loggedUser);
    setAuthOpen(false);
    void economy.recargarEconomia();
  };

  /** Cierra la sesión en el servidor (borra cookie HttpOnly) y limpia la memoria local. */
  const logout = () => {
    setUser(null);
    setAuthOpen(false);
    void logoutAuthSession().then(() => economy.recargarEconomia());
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
