import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppNavbar from "./AppNavbar";
import type { Usuario } from "./navbar.types";
import { setSessionUser } from "../../AUTH/sessionStore";

/** La navbar navega con el router de la app; las pruebas la montan en memoria. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

/** Refleja la ruta activa y el origen pedido por el perfil. */
function SondaRuta() {
  const location = useLocation();
  return (
    <>
      <span data-testid="ruta">{location.pathname}</span>
      <span data-testid="origen">
        {(location.state as { from?: string } | null)?.from ?? ""}
      </span>
    </>
  );
}

/** La prueba usa la sesión real en memoria y simula solo las dependencias externas de economía/red. */
const economy = vi.hoisted(() => ({
  puntos: 120,
  racha: 0,
  isLoading: false,
  rachaPuntosDia: 40,
  rachaTramosDiarios: [
    { dias: 1, puntos: 40 },
    { dias: 15, puntos: 80 },
  ],
  recargarEconomia: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../context/PlayerEconomyContext", () => ({
  usePlayerEconomy: () => economy,
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
        <button onClick={() => onSuccess({ id: 1, name: "Ana" })}>
          Entrar en prueba
        </button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser(null);
  economy.puntos = 120;
  economy.racha = 0;
  window.history.replaceState({}, "", "/");
  vi.stubGlobal("fetch", vi.fn(async () => new Response('{"success":true}')));
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  setSessionUser(null);
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("AppNavbar: estructura y estados compartidos", () => {
  /** Acceso y salida actualizan la misma navbar, notifican al consumidor y usan cookie HttpOnly sin localStorage. */
  it("transiciona de invitado a autenticado y cierra sesión vía /api/auth/logout", async () => {
    const notify = vi.fn();
    economy.racha = 3;
    const { container } = render(
      <AppNavbar view={{ kind: "menu" }} onUsuarioChange={notify} />,
      { wrapper },
    );
    expect(container.querySelectorAll("header")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    fireEvent.click(screen.getByRole("button", { name: "Entrar en prueba" }));
    expect(container.querySelector("header")).toHaveAttribute(
      "data-navbar-session",
      "authenticated",
    );
    expect(screen.getByTitle("Días de racha")).toHaveTextContent("3 días");
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
    await waitFor(() => expect(economy.recargarEconomia).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/logout"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(localStorage.getItem("usuario")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  /** Muestra 0 días cuando la racha está cortada en vez de simular 1. */
  it("muestra exactamente la racha del contexto (incluido 0 y singular 1 día)", () => {
    setSessionUser({ id: 1, name: "Ana" });
    economy.racha = 0;
    const { rerender } = render(<AppNavbar view={{ kind: "menu" }} />, {
      wrapper,
    });
    expect(screen.getByTitle("Días de racha")).toHaveTextContent("0 días");

    economy.racha = 1;
    rerender(<AppNavbar view={{ kind: "menu" }} />);
    expect(screen.getByTitle("Días de racha")).toHaveTextContent("1 día");
  });

  /** El indicador de racha abre su detalle y el cierre devuelve la navegación al menú. */
  it("abre el progreso de racha al tocar el indicador y lo cierra con Seguir jugando", () => {
    setSessionUser({ id: 1, name: "Ana" });
    economy.racha = 3;
    render(<AppNavbar view={{ kind: "menu" }} />, { wrapper });

    fireEvent.click(screen.getByTitle("Días de racha"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Te faltan 12 días")).toBeInTheDocument();
    expect(screen.getByText("1 de 2 hitos")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Seguir jugando" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  /** Cambiar de contexto conserva la estructura y activa únicamente los slots correspondientes. */
  it("comparte estructura y tema oscuro del menú también en el juego", () => {
    const back = vi.fn();
    const action = vi.fn();
    const { container, rerender } = render(
      <AppNavbar
        view={{ kind: "calendar", title: "Palabra del día", onBack: back }}
      />,
      { wrapper },
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
      { wrapper },
    );
    const bulb = screen.getByRole("button", { name: "Pedir una pista" });
    expect(bulb).toBeDisabled();
    fireEvent.click(bulb);
    expect(onHint).not.toHaveBeenCalled();
    rerender(<AppNavbar view={{ ...view, hintDisabled: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Pedir una pista" }));
    expect(onHint).toHaveBeenCalledOnce();
  });

  /** Actualizaciones en memoria de la sesión se reflejan inmediatamente sin eventos de storage. */
  it("sincroniza cambios de sesión en memoria y vuelve a invitado si se limpia la sesión", () => {
    const { container } = render(<AppNavbar view={{ kind: "menu" }} />, {
      wrapper,
    });
    act(() => {
      setSessionUser({ id: 2, name: "Luis" });
    });
    expect(container.querySelector("header")).toHaveAttribute(
      "data-navbar-session",
      "authenticated",
    );
    act(() => {
      setSessionUser(null);
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
      "/?abrirLogin=true&origen=correo#juegos",
    );
    render(<AppNavbar view={{ kind: "menu" }} />, { wrapper });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(window.location.search).toBe("?origen=correo");
    expect(window.location.hash).toBe("#juegos");
  });
});

describe("AppNavbar: acceso al perfil", () => {
  /** El saludo es la única entrada desde el menú; el icono de cuenta no se duplica. */
  it("abre el perfil desde el menú y recuerda de dónde vino", () => {
    setSessionUser({ id: 1, name: "Ana" });
    render(
      <MemoryRouter initialEntries={["/menu"]}>
        <AppNavbar view={{ kind: "menu" }} />
        <SondaRuta />
      </MemoryRouter>,
    );

    const saludo = screen.getByRole("link", { name: /¡Hola, Ana!/ });
    expect(saludo).toHaveAttribute("href", "/perfil");
    expect(
      screen.queryByRole("button", { name: "Abrir mi perfil" }),
    ).not.toBeInTheDocument();
    fireEvent.click(saludo);
    expect(screen.getByTestId("ruta")).toHaveTextContent("/perfil");
    expect(screen.getByTestId("origen")).toHaveTextContent("/menu");
  });

  /** El calendario también abre el perfil, pero la pantalla de juego no expone la salida. */
  it("abre el perfil desde el calendario y no desde el juego", () => {
    setSessionUser({ id: 1, name: "Ana" });
    const back = vi.fn();
    const { rerender } = render(
      <MemoryRouter initialEntries={["/juegos/wordle"]}>
        <AppNavbar view={{ kind: "calendar", title: "Palabra del día", onBack: back }} />
        <SondaRuta />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir mi perfil" }));
    expect(screen.getByTestId("ruta")).toHaveTextContent("/perfil");
    expect(screen.getByTestId("origen")).toHaveTextContent("/juegos/wordle");

    rerender(
      <MemoryRouter>
        <AppNavbar view={{ kind: "game", title: "Resultado", onBack: back }} />
        <SondaRuta />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("button", { name: "Abrir mi perfil" }),
    ).not.toBeInTheDocument();
  });

  /** El perfil usa el título propio junto a la marca y no repite el saludo del menú. */
  it("muestra el contexto de perfil con regreso Volver", () => {
    setSessionUser({ id: 1, name: "Ana" });
    const back = vi.fn();
    render(
      <MemoryRouter>
        <AppNavbar view={{ kind: "profile", title: "Mi perfil", onBack: back }} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Mi perfil" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/¡Hola/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(back).toHaveBeenCalledOnce();
  });
});
