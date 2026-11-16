import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MenuCard from "./MenuCard";
import type { MenuCardGame } from "./menuGames";

vi.mock("@ionic/react", () => ({
  IonIcon: () => <span aria-hidden="true" />,
}));

vi.mock("./GamePreview", () => ({
  default: () => <div data-testid="game-preview" />,
}));

afterEach(() => {
  cleanup();
});

describe("MenuCard", () => {
  it("renderiza un enlace <a> real hacia la ruta del juego cuando está disponible", () => {
    const game: MenuCardGame = {
      id: "sopa-letras",
      path: "/juegos/sopa-letras",
      group: "Clásicos",
      title: "Sopa de letras",
      skill: "Atención visual y rastreo",
      description: "Buscá 4 palabras temáticas.",
      available: true,
    };

    render(
      <MemoryRouter>
        <MenuCard game={game} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Jugar Sopa de letras" });
    expect(link).toHaveAttribute("href", "/juegos/sopa-letras");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mantiene un botón deshabilitado cuando el juego aún no está disponible", () => {
    const game: MenuCardGame = {
      id: "sudoku",
      path: "/juegos/sudoku",
      group: "Clásicos",
      title: "Sudoku diario",
      skill: "Lógica y concentración",
      description: "Tableros adaptados.",
      available: false,
    };

    render(
      <MemoryRouter>
        <MenuCard game={game} />
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", { name: "Próximamente Sudoku diario" });
    expect(button).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
