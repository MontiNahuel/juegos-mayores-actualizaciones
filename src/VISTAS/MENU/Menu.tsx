/* Muestra los juegos y permite abrir sus calendarios. */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IonContent, IonPage } from "@ionic/react";
import { BrainIcon } from "../COMPONENTS/Icons/Icons";
import MenuCard from "./MenuCard";
import { gameSections } from "./menuGames";
import AppNavbar from "../COMPONENTS/Navbar/AppNavbar";
import { esUsuarioAdmin } from "../AUTH/authUtils";
import "./Menu.css";

// Muestra los juegos y permite abrir sus calendarios.
const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [esAdmin, setEsAdmin] = useState<boolean>(esUsuarioAdmin);

  return (
    <IonPage>
      <AppNavbar
        view={{ kind: "menu" }}
        onUsuarioChange={() => setEsAdmin(esUsuarioAdmin())}
      />
      <IonContent className="menu-content">
        <main className="menu-shell menu-theme box-border mx-auto max-w-[1180px] px-9 pt-9 pb-[max(calc(env(safe-area-inset-bottom,0px)+28px),56px)] text-menu-ink max-md:px-5 max-md:pt-6 max-md:pb-[max(calc(env(safe-area-inset-bottom,0px)+24px),48px)]">
          <header className="menu-heading mt-3 mb-8 flex items-center gap-5 max-md:mt-2 max-md:items-start max-md:gap-3.5">
            <div
              className="flex shrink-0 text-[#8bd9cc] max-md:[&_svg]:size-9"
              aria-hidden="true"
            >
              <BrainIcon className="" size={48} />
            </div>
            <div>
              <h1 className="m-0! text-[2.125rem]! leading-[1.2]! font-bold! tracking-[-.02em] max-md:text-[1.75rem]!">
                Un momento para tu mente
              </h1>
              <p className="mt-2.5 mb-0 text-lg leading-[1.55] text-menu-copy">
                Elegí un juego. Disfrutá el desafío, a tu ritmo.
              </p>
            </div>
          </header>
          {esAdmin && (
            <aside
              className="mb-7 flex flex-wrap items-center justify-between gap-[18px] rounded-[14px] bg-[#fff4db] p-[22px] text-[#62480e]"
              aria-labelledby="menu-admin-title"
            >
              <div className="flex-[1_1_260px]">
                <h2 id="menu-admin-title" className="m-0! text-lg!">
                  Torre de Control Narrativa
                </h2>
                <p className="mt-2 mb-0 text-base leading-normal">
                  Rol Administrador
                </p>
                <p className="mt-2 mb-0 text-base leading-normal">
                  Configuración completa: universos, personajes, cartas, eventos
                  y desafíos del juego narrativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/editor-narrativo")}
                className="min-h-12 cursor-pointer rounded-[10px] border-0 bg-[#62480e] px-[18px] py-3 font-[inherit] text-white"
              >
                Abrir Editor Narrativo
              </button>
            </aside>
          )}

          {gameSections.map((section) => (
            <section
              key={section.title}
              className="menu-section [&+.menu-section]:mt-[34px]"
              aria-labelledby={`group-${section.title}`}
            >
              <h2
                id={`group-${section.title}`}
                className="mt-0! mb-[18px]! text-[1.375rem]! leading-[1.3]! font-bold!"
              >
                {section.title}
              </h2>
              <div className="menu-grid grid grid-cols-2 gap-5 max-md:grid-cols-1 max-md:gap-4">
                {section.games.map((game) => (
                  <MenuCard
                    game={game}
                    key={game.id}
                    onStart={() => navigate(game.path)}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Menu;
