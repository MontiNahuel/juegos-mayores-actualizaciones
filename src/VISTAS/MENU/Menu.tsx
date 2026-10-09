import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/react';
import { bookOutline, gridOutline, navigateOutline, textOutline } from 'ionicons/icons';
import { BrainIcon, FlameIcon, StarIcon } from '../COMPONENTS/Icons/Icons';
import MenuCard, { type GameGroup, type MenuCardGame } from './MenuCard';

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
    description: 'Encontrá la palabra y poné a trabajar tu memoria con pistas claras.',
    icon: textOutline, accent: color.teal, available: true,
  },
  {
    id: 'sudoku', group: 'Clásicos', title: 'Mini-Sudoku 4x4', skill: 'Lógica y concentración',
    description: 'Un tablero breve para entrenar la atención sin apuro.',
    icon: gridOutline, accent: color.lavender,
  },
  {
    id: 'crucigrama', group: 'Narrativos', title: 'Crucigrama cotidiano', skill: 'Lenguaje y recuerdos',
    description: 'Pistas cercanas para conectar palabras, ideas y memorias.',
    icon: bookOutline, accent: color.coral,
  },
  {
    id: 'ruta-postal', group: 'Narrativos', title: 'La ruta postal', skill: 'Atención visual',
    description: 'Seguí un recorrido y encontrá las señales importantes en pantalla.',
    icon: navigateOutline, accent: color.teal,
  },
];

const groups: { title: GameGroup; description: string }[] = [
  { title: 'Clásicos', description: 'Juegos conocidos para ejercitar lenguaje, memoria y lógica.' },
  { title: 'Narrativos', description: 'Pequeñas historias que invitan a observar, recordar y decidir.' },
];

const styles: Record<string, CSSProperties> = {
  shell: { background: color.blue, margin: '0 auto', maxWidth: 1050, minHeight: '100%', padding: '34px clamp(18px, 5vw, 58px) 52px' },
  heading: { color: color.ink, fontSize: 25, lineHeight: 1.18, margin: 0, fontWeight: 800 },
  description: { color: color.ink, fontSize: 16, lineHeight: 1.45, margin: '8px 0 0' },
  grid: { display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', marginTop: 16 },
};

const WebHeader: React.FC = () => (
  <IonHeader style={{ boxShadow: '0 1px 8px rgba(23, 59, 99, 0.14)' }}>
    <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': 0 } as CSSProperties}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', margin: '0 auto', maxWidth: 1180, minHeight: 76, padding: '10px 20px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <img alt="ASISTODO" src="/asistodo-logo.svg" style={{ height: 46, width: 46 }} />
          <div>
            <strong style={{ color: color.blue, display: 'block', fontSize: 22 }}>ASISTODO</strong>
            <span style={{ color: color.ink, fontSize: 14 }}>Juegos de estimulación cognitiva</span>
          </div>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
          <div style={{ color: color.ink, fontSize: 14, textAlign: 'right' }}>
            <strong style={{ display: 'block', fontSize: 16 }}>Hola, Beatriz</strong>
            Tu gimnasia mental de hoy
          </div>
          <div style={{ alignItems: 'center', background: '#FFF6DF', border: '1px solid #F3D37A', borderRadius: 18, color: '#855E10', display: 'flex', fontWeight: 700, gap: 6, padding: '8px 10px' }}>
            <FlameIcon className="" size={19} /> 5 días
          </div>
          <div style={{ alignItems: 'center', background: '#E8F8F5', border: '1px solid #8FD5CA', borderRadius: 18, color: '#17695F', display: 'flex', fontWeight: 700, gap: 6, padding: '8px 10px' }}>
            <StarIcon className="" size={18} /> 120 puntos
          </div>
        </div>
      </div>
    </IonToolbar>
  </IonHeader>
);

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const startGame = (id: string) => id === 'wordle' && navigate('/juegos/wordle');

  return (
    <IonPage>
      <WebHeader />
      <IonContent style={{ '--background': color.blue } as CSSProperties}>
        <div style={{ background: color.blue, minHeight: '100%' }}>
          <main style={styles.shell}>
            <header style={{ alignItems: 'center', display: 'flex', gap: 13, marginBottom: 34 }}>
              <div aria-hidden="true" style={{ color: color.teal, height: 42, width: 42 }}><BrainIcon className="" size={42} /></div>
              <h1 style={{ color: '#FFFFFF', fontSize: 31, lineHeight: 1.18, margin: 0 }}>Ejercicios para tu mente</h1>
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
