import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppNavbar from "./AppNavbar";
import type { Usuario } from "./navbar.types";

/** La prueba usa la sesión real del hook y simula solo las dependencias externas de presentación/economía. */
const economy = vi.hoisted(() => ({
  puntos: 120,
  isLoading: false,
  recargarEconomia: vi.fn(),
}));
vi.mock("../../../context/PlayerEconomyContext", () => ({
  usePlayerEconomy: () => economy,
}));
vi.mock("../../AUTH/authUtils", () => ({
  limpiarTodasLasSesiones: () => localStorage.clear(),
}));
vi.mock("@ionic/react", () => ({
  IonHeader: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <header {...props}>{children}</header>
  ),
  IonToolbar: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  IonIcon: () => <span aria-hidden="true" />,
}));
vi.mock("../AnimatedPointsBadge", () => ({
  AnimatedPointsBadge: ({
    points,
    earned,
  }: {
    points: number;
    earned?: number;
  }) => (
    <span>
      {points} puntos; {earned ?? 0} ganados
    </span>
  ),
}));
vi.mock("../MODALS/AuthModal", () => ({
  AuthModal: ({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: Usuario) => void;
  }) =>
    isOpen ? (
      <div role="dialog">
        <button onClick={() => onSuccess({ id: 1, name: "Ana", racha: 3 })}>
          Entrar en prueba
        </button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/menu");
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("AppNavbar: estructura y estados compartidos", () => {
  /** Acceso y salida actualizan la misma navbar, notifican al consumidor y recargan la economía. */
  it("transiciona de invitado a autenticado y de vuelta sin duplicar cabeceras", () => {
    const notify = vi.fn();
    const { container } = render(
      <AppNavbar view={{ kind: "menu" }} onUsuarioChange={notify} />,
    );
    expect(container.querySelectorAll("header")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    fireEvent.click(screen.getByRole("button", { name: "Entrar en prueba" }));
    expect(container.querySelector("header")).toHaveAttribute(
      "data-navbar-session",
      "authenticated",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(notify).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "Ana" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(container.querySelector("header")).toHaveAttribute(
      "data-navbar-session",
      "guest",
    );
    expect(notify).toHaveBeenLastCalledWith(null);
    expect(economy.recargarEconomia).toHaveBeenCalledTimes(2);
  });

  /** Cambiar de contexto conserva la estructura y activa únicamente los slots correspondientes. */
  it("comparte estructura y tema oscuro del menú también en el juego", () => {
    const back = vi.fn();
    const action = vi.fn();
    const { container, rerender } = render(
      <AppNavbar
        view={{ kind: "calendar", title: "Palabra del día", onBack: back }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Palabra del día" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Iniciar sesión" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Volver al menú principal" }),
    );
    expect(back).toHaveBeenCalledOnce();
    rerender(
      <AppNavbar
        view={{
          kind: "game",
          title: "Resultado",
          onBack: back,
          details: <span>Nivel fácil</span>,
          pointsEarned: 20,
          rightAction: <button onClick={action}>Pista</button>,
        }}
      />,
    );
    expect(container.querySelectorAll("header")).toHaveLength(1);
    expect(container.querySelector("header")).toHaveClass(
      "cognitive-navbar",
      "menu-theme",
    );
    expect(screen.getByText("Nivel fácil")).toBeInTheDocument();
    expect(screen.getByText("120 puntos; 20 ganados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pista" }));
    expect(action).toHaveBeenCalledOnce();
  });

  /** La única navbar muestra la bombilla y respeta el bloqueo de pistas del juego. */
  it("controla la bombilla dentro de AppNavbar", () => {
    const onHint = vi.fn();
    const view = {
      kind: "game" as const,
      title: "Juego",
      onBack: vi.fn(),
      onHint,
    };
    const { rerender } = render(
      <AppNavbar view={{ ...view, hintDisabled: true }} />,
    );
    const bulb = screen.getByRole("button", { name: "Pedir una pista" });
    expect(bulb).toBeDisabled();
    fireEvent.click(bulb);
    expect(onHint).not.toHaveBeenCalled();
    rerender(<AppNavbar view={{ ...view, hintDisabled: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Pedir una pista" }));
    expect(onHint).toHaveBeenCalledOnce();
  });

  /** Una sesión actualizada fuera del componente se refleja, y un JSON inválido elimina datos obsoletos. */
  it("sincroniza eventos locales y de otras pestañas sin conservar un usuario inválido", () => {
    const { container } = render(<AppNavbar view={{ kind: "menu" }} />);
    act(() => {
      localStorage.setItem("usuario", JSON.stringify({ id: 2, name: "Luis" }));
      window.dispatchEvent(new Event("user_progress_updated"));
    });
    expect(container.querySelector("header")).toHaveAttribute(
      "data-navbar-session",
      "authenticated",
    );
    act(() => {
      localStorage.setItem("usuario", "{invalid");
      window.dispatchEvent(new Event("storage"));
    });
    expect(container.querySelector("header")).toHaveAttribute(
      "data-navbar-session",
      "guest",
    );
  });

  /** Los enlaces de acceso abren el modal sin borrar otros parámetros ni el fragmento del usuario. */
  it("consume abrirLogin manteniendo el resto de la dirección", () => {
    window.history.replaceState(
      {},
      "",
      "/menu?abrirLogin=true&origen=correo#juegos",
    );
    render(<AppNavbar view={{ kind: "menu" }} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(window.location.search).toBe("?origen=correo");
    expect(window.location.hash).toBe("#juegos");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
