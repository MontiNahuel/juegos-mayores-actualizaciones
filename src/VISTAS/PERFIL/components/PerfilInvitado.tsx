/* Invitación a iniciar sesión cuando no hay usuario. */
import { IonIcon } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { PANEL } from './paneles';

interface PerfilInvitadoProps {
  onVolver: () => void;
}

export function PerfilInvitado({ onVolver }: PerfilInvitadoProps) {
  return (
    <section className={`${PANEL} mt-3 text-center`} aria-labelledby="perfil-invitado">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#8bd9cc]/15 text-[#8bd9cc]">
        <IonIcon icon={personCircleOutline} className="text-3xl" aria-hidden="true" />
      </span>
      <h1 id="perfil-invitado" className="mt-4 mb-0! text-[1.75rem]! leading-tight! font-bold!">
        Tu perfil te espera
      </h1>
      <p className="mx-auto mt-2.5 mb-0 max-w-[52ch] text-base leading-[1.55] text-menu-copy">
        Iniciá sesión desde el menú para ver tus medallas, tus tiempos y tu constancia en cada
        juego.
      </p>
      <button
        type="button"
        onClick={onVolver}
        className="mt-6 min-h-12 cursor-pointer rounded-[10px] border-0 bg-[#8bd9cc] px-5 py-3 font-[inherit] text-base font-bold text-[#172433] transition-colors hover:bg-[#a5e5da]"
      >
        Volver al menú
      </button>
    </section>
  );
}

export default PerfilInvitado;
