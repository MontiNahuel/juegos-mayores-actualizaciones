/* Arma la aplicación con sus pantallas y las ventanas de tienda y pistas. */
import { IonApp, setupIonicReact } from '@ionic/react';
import AppRoutes from './VISTAS/routes';
import { PlayerEconomyProvider } from './context/PlayerEconomyContext';
import MiniTiendaModal from './VISTAS/COMPONENTS/MODALS/MiniTiendaModal';
import ComprarPistaModal from './VISTAS/COMPONENTS/MODALS/ComprarPistaModal';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
/* import '@ionic/react/css/normalize.css'; - Desactivado: resetea padding, border y border-radius de <button> pisando Tailwind */
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
/* import '@ionic/react/css/padding.css'; */
/* import '@ionic/react/css/float-elements.css'; */
/* import '@ionic/react/css/text-alignment.css'; */
/* import '@ionic/react/css/text-transformation.css'; */
/* import '@ionic/react/css/flex-utils.css'; */
/* import '@ionic/react/css/display.css'; */

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

// Arma la aplicación con sus pantallas y las ventanas de tienda y pistas.
const App: React.FC = () => (
  <IonApp>
    <PlayerEconomyProvider>
      <AppRoutes />
      <MiniTiendaModal />
      <ComprarPistaModal />
    </PlayerEconomyProvider>
  </IonApp>
);

export default App;
