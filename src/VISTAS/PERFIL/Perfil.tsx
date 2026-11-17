/* Perfil del jugador: wiring de la página y sus secciones. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppNavbar from '../COMPONENTS/Navbar/AppNavbar';
import { usePlayerEconomy } from '../../context/PlayerEconomyContext';
import { getSessionUser, subscribeSessionUser, type SessionUser } from '../AUTH/sessionStore';
import { ConstanciaSection } from './components/ConstanciaSection';
import { PanelCargando } from './components/PanelCargando';
import { PanelError } from './components/PanelError';
import { PerfilHeader } from './components/PerfilHeader';
import { PerfilInvitado } from './components/PerfilInvitado';
import { ResumenTarjetas } from './components/ResumenTarjetas';
import { ConsejosCarrusel } from './components/consejos/ConsejosCarrusel';
import { usePerfilResumen } from './hooks/usePerfilResumen';
import { MedallasSection } from './components/medallas/MedallasSection';
import { PlanesModal } from './components/planes/PlanesModal';
import { ProgresoPanel } from './components/progreso/ProgresoPanel';
import { destinoDeVuelta } from './utils/perfilNavegacion';
import { motivosDeConsejos } from './utils/perfilUtils';
import '../MENU/Menu.css';

const Perfil = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
    racha,
    rachaHoyIngresada,
    puntos,
    suscripcion,
    diasDesbloqueados,
    bonusRacha,
  } = usePlayerEconomy();
  const [usuario, setUsuario] = useState<SessionUser | null>(() => getSessionUser());
  const [planesAbiertos, setPlanesAbiertos] = useState(false);
  const { resumen, cargando, error, recargar } = usePerfilResumen(isAuthenticated);

  const volver = useCallback(() => {
    navigate(destinoDeVuelta(location.state));
  }, [navigate, location.state]);

  useEffect(() => subscribeSessionUser(setUsuario), []);

  const motivos = useMemo(
    () => (resumen ? motivosDeConsejos(resumen, racha) : {}),
    [resumen, racha],
  );

  const esPremium = suscripcion === 'premium';

  return (
    <IonPage>
      <AppNavbar view={{ kind: 'profile', title: 'Mi perfil', onBack: volver }} />
      <IonContent className="menu-content">
        <main className="menu-shell menu-theme box-border mx-auto max-w-[1180px] px-9 pt-9 pb-[max(calc(env(safe-area-inset-bottom,0px)+28px),56px)] text-menu-ink max-md:px-5 max-md:pt-6">
          {!isAuthenticated ? (
            <PerfilInvitado onVolver={() => navigate('/menu')} />
          ) : (
            <>
              <PerfilHeader
                usuario={usuario}
                esPremium={esPremium}
                mesActual={resumen?.periodo.mes}
              />

              <ResumenTarjetas
                racha={racha}
                rachaHoyIngresada={rachaHoyIngresada}
                puntos={puntos}
                isLoading={isLoading}
                esPremium={esPremium}
                diasDesbloqueados={diasDesbloqueados}
                onMejorar={() => setPlanesAbiertos(true)}
              />

              {error && <PanelError cargando={cargando} onReintentar={() => void recargar()} />}

              {!resumen && !error && (cargando || isLoading) && <PanelCargando />}

              {resumen && (
                <>
                  <div className="mt-9">
                    <ProgresoPanel
                      meses={resumen.meses}
                      actual={resumen.periodo.mes}
                      hasta={resumen.periodo.hasta}
                    />
                  </div>
                  <ConsejosCarrusel consejos={resumen.consejos} motivos={motivos} />
                  <MedallasSection
                    meses={resumen.meses}
                    historico={resumen.medallas.historico}
                    rendimiento={resumen.rendimiento}
                    actual={resumen.periodo.mes}
                  />
                </>
              )}

              <ConstanciaSection resumen={resumen} racha={racha} bonusRacha={bonusRacha} />
            </>
          )}
        </main>
      </IonContent>
      <PlanesModal isOpen={planesAbiertos} onClose={() => setPlanesAbiertos(false)} />
    </IonPage>
  );
};

export default Perfil;
