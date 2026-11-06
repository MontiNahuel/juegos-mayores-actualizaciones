import type { CSSProperties } from "react";
import { IonHeader, IonToolbar, IonIcon } from "@ionic/react";
import {
  flameOutline,
  starOutline,
  logInOutline,
  logOutOutline,
} from "ionicons/icons";
import { AuthModal } from "../MODALS/AuthModal";
import { AnimatedPointsBadge } from "../AnimatedPointsBadge";
import { useNavbarSession } from "./useNavbarSession";
import type { AppNavbarProps, NavbarView, Usuario } from "./navbar.types";
import "../../MENU/Menu.css";

/** Identidad compartida: marca completa en menú y regreso contextual en las demás pantallas. */
function NavbarIdentity({
  view,
  user,
}: {
  view: NavbarView;
  user: Usuario | null;
}) {
  if (view.kind === "menu")
    return (
      <>
        <a
          href="/menu"
          className="menu-brand flex shrink-0 items-center gap-2.5 text-[17px] leading-[1.2] font-extrabold text-menu-ink! no-underline max-md:gap-2 max-md:text-[15px]"
          aria-label="ASISTODO, inicio"
        >
          <img
            src="/asistodo-logo.svg"
            alt=""
            width="40"
            height="40"
            className="max-md:size-[34px]"
          />
          <span>
            ASISTODO
            <span className="mt-1 block text-[13px] leading-[1.2] font-normal text-menu-copy max-md:text-xs max-[360px]:hidden">
              Mente en juego
            </span>
          </span>
        </a>
        <span className="flex-1 pl-[26px] text-[15px] text-menu-copy [overflow-wrap:anywhere] max-[1001px]:hidden">
          {user ? `¡Hola, ${user.name}!` : ""}
        </span>
      </>
    );

  // El consumidor decide el destino; la navbar no altera por su cuenta el historial.
  return (
    <button
      type="button"
      onClick={view.onBack}
      className={`flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294c6b] ${view.kind === "game" ? "size-[42px]" : "size-10 max-md:size-[34px]"}`}
      aria-label="Volver al menú principal"
      title="Volver al menú principal"
    >
      <img
        src="/asistodo-logo.svg"
        alt="ASISTODO"
        width={view.kind === "game" ? 42 : 40}
        height={view.kind === "game" ? 42 : 40}
        className={view.kind === "game" ? undefined : "max-md:size-[34px]"}
      />
    </button>
  );
}

/** Indicadores y acceso únicos: el menú habilita cambiar sesión; el calendario conserva solo progreso. */
function NavbarAccount({
  showSession,
  user,
  points,
  loading,
  onLogin,
  onLogout,
}: {
  /** Visibilidad de acceso/salida según el contexto de la pantalla. */
  showSession: boolean;
  /** Usuario sincronizado; null representa al invitado. */
  user: Usuario | null;
  /** Saldo real y estado de carga del contexto de economía. */
  points: number;
  loading: boolean;
  /** Callbacks del mismo controlador de sesión en todos los contextos. */
  onLogin: () => void;
  onLogout: () => void;
}) {
  if (!user && !showSession) return null;
  return (
    <div className="navbar-account ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-4 max-md:gap-2.5 max-[360px]:gap-1.5">
      {/* Los indicadores solo aparecen con sesión; nunca se simula una racha o saldo de invitado. */}
      {user && (
        <>
          <span
            title="Días de racha"
            className="flex items-center gap-[5px] text-[15px] whitespace-nowrap text-[#edd499] tabular-nums max-md:text-sm"
          >
            <IonIcon icon={flameOutline} aria-hidden="true" />
            <span>{user.racha ?? 0}</span>
            <span className="max-md:hidden"> días</span>
          </span>
          <span
            title="Puntos acumulados"
            aria-label={
              loading ? "Cargando puntos" : `${points} puntos acumulados`
            }
            className="flex items-center gap-[5px] rounded-[10px] bg-[#28384b] px-3 py-2.5 text-[15px] whitespace-nowrap text-[#edd499] tabular-nums max-[360px]:px-2"
          >
            <IonIcon
              icon={starOutline}
              aria-hidden="true"
              className="text-xl"
            />
            <span>{loading ? "…" : points.toLocaleString("es-AR")}</span>
            <span className="max-md:hidden"> puntos</span>
          </span>
        </>
      )}
      {/* El estado de sesión resuelve etiqueta, icono y acción del mismo botón. */}
      {showSession && (
        <button
          type="button"
          className="menu-nav__session flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#526176] bg-[#263548] px-4 py-2.5 font-[inherit] text-[15px] text-menu-ink hover:bg-[#28384b] max-md:px-2.5"
          onClick={user ? onLogout : onLogin}
          aria-label={user ? "Cerrar sesión" : "Iniciar sesión"}
        >
          <IonIcon
            icon={user ? logOutOutline : logInOutline}
            aria-hidden="true"
          />
          <span>{user ? "Salir" : "Iniciar sesión"}</span>
        </button>
      )}
    </div>
  );
}

/** Única estructura de navbar: el contexto define contenidos y preserva el tema del juego hasta su rediseño. */
export default function AppNavbar({ view, onUsuarioChange }: AppNavbarProps) {
  const { session, economy, authOpen, openAuth, closeAuth, login, logout } =
    useNavbarSession(onUsuarioChange);
  const menu = view.kind === "menu";
  const game = view.kind === "game";
  // El menú permite saludo y cuenta; calendario/juego reservan un centro flexible para el título.
  const layoutClass = menu
    ? "menu-nav mx-auto flex min-h-[88px] max-w-[1180px] flex-wrap items-center gap-6 px-9 py-4 text-menu-ink max-md:min-h-[78px] max-md:gap-3.5 max-md:px-5 max-md:py-3 max-[360px]:gap-1.5 max-[360px]:px-3"
    : game
      ? "mx-auto grid min-h-[74px] w-full max-w-[1180px] grid-cols-[42px_minmax(0,1fr)_auto] items-center justify-between gap-3 px-4 py-2.5"
      : "menu-nav mx-auto grid min-h-[88px] w-full max-w-[1180px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-9 py-4 text-menu-ink max-md:min-h-[78px] max-md:grid-cols-[34px_minmax(0,1fr)_auto] max-md:px-5 max-md:py-3 max-md:[&_.navbar-account]:col-span-full max-md:[&_.navbar-account]:justify-self-end max-[360px]:px-3";

  return (
    <>
      {/* La misma cabecera aplica el tema del menú a menú/calendario. El juego conserva su diseño hasta su revisión propia. */}
      <IonHeader
        data-navbar-context={view.kind}
        data-navbar-session={session.kind}
        className={
          game
            ? "app-navbar-game"
            : "cognitive-navbar menu-theme border-b border-[#364454] shadow-none"
        }
        style={
          game ? { boxShadow: "0 2px 10px rgba(23, 59, 99, 0.12)" } : undefined
        }
      >
        <IonToolbar
          style={
            game
              ? ({
                  "--background": "#FFFFFF",
                  "--border-width": 0,
                } as CSSProperties)
              : undefined
          }
        >
          <div className={layoutClass}>
            <NavbarIdentity view={view} user={session.user} />
            {/* Los puntos animados pertenecen al juego/resultado; el calendario solo necesita el título. */}
            {view.kind !== "menu" && (
              <div className="min-w-0 text-center">
                <h1
                  className={
                    game
                      ? "m-0! text-[clamp(18px,2.4vw,22px)]! leading-[1.25]! font-black! text-[#294C6B] whitespace-normal"
                      : "m-0! text-[1.375rem]! leading-tight! font-bold! text-menu-ink max-md:text-lg!"
                  }
                >
                  {view.title}
                </h1>
                {view.kind === "game" && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {view.details}
                    <AnimatedPointsBadge
                      points={economy.puntos}
                      earned={view.pointsEarned}
                    />
                  </div>
                )}
              </div>
            )}
            {/* Pistas/acciones del juego ocupan el mismo slot que las acciones de cuenta del menú. */}
            {view.kind === "game" ? (
              <div className="flex items-center justify-end gap-2">
                {view.rightAction}
              </div>
            ) : (
              <NavbarAccount
                showSession={menu}
                user={session.user}
                points={economy.puntos}
                loading={economy.isLoading}
                onLogin={openAuth}
                onLogout={logout}
              />
            )}
          </div>
        </IonToolbar>
      </IonHeader>
      {/* El único modal comparte apertura, cierre, acceso y sincronización con todas las pantallas. */}
      <AuthModal isOpen={authOpen} onClose={closeAuth} onSuccess={login} />
    </>
  );
}
