import React from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { bookOutline, gridOutline, navigateOutline, textOutline } from 'ionicons/icons';
import { BrainIcon } from '../COMPONENTS/Icons/Icons';
import MenuCard, { type GameGroup, type MenuCardGame } from './MenuCard';
import LoginHeader from '../LOGIN/LoginHeader';

const color = {
  blue: '#294C6B',
  ink: '#46556D',
  paper: '#F4F6F9',
  panel: '#DEE3EA',
  teal: '#53BFC9',
  lavender: '#AFA1E8',
  coral: '#E88778',
};

const games: MenuCardGame[] = [
  {
    id: 'wordle', group: 'Clásicos', title: 'Palabra del día', skill: 'Memoria y vocabulario',
    description: 'EncontrÃ¡ la palabra y ponÃ© a trabajar tu memoria con pistas claras.',
    icon: textOutline, accent: color.teal, available: true,
  },
  {
    id: 'sudoku', group: 'Clásicos', title: 'Mini-Sudoku 4x4', skill: 'Lógica y concentración',
    description: 'Un tablero breve para entrenar la atención sin apuro.',
    icon: gridOutline, accent: color.lavender, available: true,
  },
  {
    id: 'crucigrama', group: 'Narrativos', title: 'Crucigrama cotidiano', skill: 'Lenguaje y recuerdos',
    description: 'Pistas cercanas para conectar palabras, ideas y memorias.',
    icon: bookOutline, accent: color.coral,
  },
  {
    id: 'ruta-postal', group: 'Narrativos', title: 'La ruta postal', skill: 'AtenciÃ³n visual',
    description: 'SeguÃ­ un recorrido y encontrÃ¡ las seÃ±ales importantes en pantalla.',
    icon: navigateOutline, accent: color.teal,
  },
];

const groups: { title: GameGroup; description: string }[] = [
  { title: 'Clásicos', description: 'Juegos conocidos para ejercitar lenguaje, memoria y lógica.' },
  { title: 'Narrativos', description: 'PequeÃ±as historias que invitan a observar, recordar y decidir.' },
];

const styles: Record<string, CSSProperties> = {
  shell: {
    background: color.blue,
    margin: '0 auto',
    maxWidth: 1050,
    minHeight: '100%',
    padding: '34px clamp(18px, 5vw, 58px) max(calc(env(safe-area-inset-bottom, 0px) + 32px), 56px)',
  },
  heading: { color: color.ink, fontSize: 25, lineHeight: 1.18, margin: 0, fontWeight: 800 },
  description: { color: color.ink, fontSize: 16, lineHeight: 1.45, margin: '8px 0 0' },
  grid: { display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', marginTop: 16 },
};

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const startGame = (id: string) => { if (id === 'wordle') navigate('/juegos/wordle'); if (id === 'sudoku') navigate('/juegos/sudoku'); };

  return (
    <IonPage>
      <LoginHeader />
      <IonContent style={{ '--background': color.blue } as CSSProperties}>
        <div style={{ background: color.blue, minHeight: '100%' }}>
          <main style={styles.shell}>
            <header style={{ alignItems: 'center', display: 'flex', gap: 13, marginBottom: 34 }}>
              <div aria-hidden="true" style={{ color: color.teal, height: 42, width: 42 }}>
                <BrainIcon className="" size={42} />
              </div>
              <h1 style={{ color: '#FFFFFF', fontSize: 31, lineHeight: 1.18, margin: 0 }}>
                Ejercicios para tu mente
              </h1>
            </header>

            {groups.map((group, index) => (
              <section key={group.title} style={{ marginTop: index ? 38 : 0 }}>
                <h2 style={{ ...styles.heading, color: '#FFFFFF' }}>{group.title}</h2>
                <p style={{ ...styles.description, color: '#DCE9F2' }}>{group.description}</p>
                <div style={styles.grid}>
                  {games.filter((game) => game.group === group.title).map((game) => (
                    <MenuCard game={game} key={game.id} onStart={startGame} />
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Menu;

