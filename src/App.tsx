/* Arma la aplicación con sus pantallas y la ventana de pistas. */
import { IonApp, setupIonicReact } from '@ionic/react';
import AppRoutes from './VISTAS/routes';
import { PlayerEconomyProvider } from './context/PlayerEconomyContext';
import ComprarPistaModal from './VISTAS/COMPONENTS/MODALS/ComprarPistaModal';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
/* import '@ionic/react/css/normalize.css'; - Desactivado: resetea padding, border y border-radius de <button> pisando Tailwind */
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

// Arma la aplicación con sus pantallas y la ventana de pistas.
const App: React.FC = () => (
  <IonApp>
    <PlayerEconomyProvider>
      <AppRoutes />
      <ComprarPistaModal />
    </PlayerEconomyProvider>
  </IonApp>
);

export default App;
