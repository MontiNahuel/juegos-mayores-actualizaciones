import { IonHeader, IonToolbar, IonIcon } from '@ionic/react';
import { logInOutline, logOutOutline, starOutline, flameOutline } from 'ionicons/icons';
import type { Usuario } from '../LOGIN/LoginHeader';
import './Menu.css';

interface Props {
  usuario: Usuario | null;
  puntos: number;
  loading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function MenuNavbar({ usuario, puntos, loading, onLogin, onLogout }: Props) {
  return (
    <IonHeader className="cognitive-navbar">
      <IonToolbar>
        <div className="menu-nav">
          <a href="/menu" className="menu-brand" aria-label="ASISTODO, inicio">
            <img src="/asistodo-logo.svg" alt="" width="40" height="40" />
            <span>ASISTODO<span className="menu-brand__sub">Mente en juego</span></span>
          </a>
          <span className="menu-nav__welcome">{usuario ? `¡Hola, ${usuario.name}!` : ''}</span>
          <div className="menu-nav__actions">
            {usuario && <span className="menu-nav__streak" title="Días de racha">
              <IonIcon icon={flameOutline} aria-hidden="true" />{usuario.racha ?? 0}<span> días</span>
            </span>}
            {usuario && <span className="menu-nav__points" aria-label={loading ? 'Cargando puntos' : `${puntos} puntos acumulados`}>
              <IonIcon icon={starOutline} aria-hidden="true" /><span>{loading ? '…' : puntos.toLocaleString('es-AR')}</span><span className="menu-nav__points-label"> puntos</span>
            </span>}
            <button className="menu-nav__session" onClick={usuario ? onLogout : onLogin} aria-label={usuario ? 'Cerrar sesión' : 'Iniciar sesión'}>
              <IonIcon icon={usuario ? logOutOutline : logInOutline} aria-hidden="true" /><span>{usuario ? 'Salir' : 'Iniciar sesión'}</span>
            </button>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
