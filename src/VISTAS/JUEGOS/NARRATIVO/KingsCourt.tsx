import { IonContent, IonPage } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { GameHeader } from '../../COMPONENTS/GameHeader';
import CardSelection, { type Desafio } from './CARDSELECTION/CardSelection';

const desafioMock: Desafio = {
  id: 'kings-court',
  personajes: [
    { id: 'consejera', nombre: 'La consejera', descripcion: 'Escucha antes de decidir.' },
    { id: 'capitan', nombre: 'El capitán', descripcion: 'Cuida a la corte.' },
    { id: 'cronista', nombre: 'La cronista', descripcion: 'Recuerda las historias.' },
    { id: 'curandera', nombre: 'La curandera', descripcion: 'Ayuda a quien lo necesita.' },
    { id: 'explorador', nombre: 'El explorador', descripcion: 'Encuentra nuevos caminos.' },
    { id: 'artesana', nombre: 'La artesana', descripcion: 'Construye soluciones.' },
  ],
};

type ChallengeState = { challenge?: { dateKey?: string; config?: { desafio?: Desafio } } };

const KingsCourt = () => {
  const challenge = (useLocation().state as ChallengeState | null)?.challenge;

  // El calendario entrega la definición diaria del backend; el mock permite seguir probando sin DB.
  const desafio = challenge?.config?.desafio || { ...desafioMock, id: challenge?.dateKey || desafioMock.id };

  return (
    <IonPage>
      <GameHeader backLabel="Calendario" backRoute="/juegos/kings-court" title="King's Court" />
      <IonContent>
        <CardSelection desafio={desafio} />
      </IonContent>
    </IonPage>
  );
};

export default KingsCourt;
