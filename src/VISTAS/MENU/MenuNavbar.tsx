import { IonHeader, IonToolbar, IonIcon } from "@ionic/react";
import {
  logInOutline,
  logOutOutline,
  starOutline,
  flameOutline,
} from "ionicons/icons";
import type { Usuario } from "../LOGIN/LoginHeader";
import "./Menu.css";

interface Props {
  usuario: Usuario | null;
  puntos: number;
  loading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function MenuNavbar({
  usuario,
  puntos,
  loading,
  onLogin,
  onLogout,
}: Props) {
  return (
    <IonHeader className="cognitive-navbar menu-theme border-b border-[#364454] shadow-none">
      <IonToolbar>
        <div className="menu-nav mx-auto flex min-h-[88px] max-w-[1180px] flex-wrap items-center gap-6 px-9 py-4 text-menu-ink max-md:min-h-[78px] max-md:gap-3.5 max-md:px-5 max-md:py-3 max-[360px]:gap-1.5 max-[360px]:px-3">
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
            {usuario ? `¡Hola, ${usuario.name}!` : ""}
          </span>
          <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-4 max-md:gap-2.5 max-[360px]:gap-1.5">
            {usuario && (
              <span
                className="flex items-center gap-[5px] text-[15px] whitespace-nowrap text-[#edd499] tabular-nums max-md:text-sm"
                title="Días de racha"
              >
                <IonIcon icon={flameOutline} aria-hidden="true" />
                {usuario.racha ?? 0}
                <span className="max-md:hidden"> días</span>
              </span>
            )}
            {usuario && (
              <span
                className="flex items-center gap-[5px] rounded-[10px] bg-[#28384b] px-3 py-2.5 text-[15px] whitespace-nowrap text-[#edd499] tabular-nums max-[360px]:px-2"
                aria-label={
                  loading ? "Cargando puntos" : `${puntos} puntos acumulados`
                }
              >
                <IonIcon
                  icon={starOutline}
                  aria-hidden="true"
                  className="text-xl"
                />
                <span>{loading ? "…" : puntos.toLocaleString("es-AR")}</span>
                <span className="max-md:hidden"> puntos</span>
              </span>
            )}
            <button
              className="menu-nav__session flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#526176] bg-[#263548] px-4 py-2.5 font-[inherit] text-[15px] text-menu-ink hover:bg-[#28384b] max-md:px-2.5"
              onClick={usuario ? onLogout : onLogin}
              aria-label={usuario ? "Cerrar sesión" : "Iniciar sesión"}
            >
              <IonIcon
                icon={usuario ? logOutOutline : logInOutline}
                aria-hidden="true"
              />
              <span>{usuario ? "Salir" : "Iniciar sesión"}</span>
            </button>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
