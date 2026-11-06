/* Muestra los juegos y permite abrir sus calendarios. */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { bookOutline, gridOutline, peopleOutline, searchOutline, textOutline } from 'ionicons/icons';
import { BrainIcon } from '../COMPONENTS/Icons/Icons';
import MenuCard, { type GameGroup, type MenuCardGame } from './MenuCard';
import LoginHeader from '../LOGIN/LoginHeader';
import { esUsuarioAdmin } from '../AUTH/authUtils';
import './Menu.css';

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
    id: 'sopa-letras', group: 'Clásicos', title: 'Sopa de letras', skill: 'Atención visual y rastreo',
    description: 'Buscá 4 palabras temáticas en una cuadrícula clara y entretenida.',
    icon: searchOutline, accent: color.coral, available: true,
  },
  {
    id: 'sudoku', group: 'Clásicos', title: 'Sudoku diario', skill: 'Lógica y concentración',
    description: 'Tableros adaptados con 3 niveles de dificultad para entrenar sin apuro.',
    icon: gridOutline, accent: color.lavender, available: true,
  },
  {
    id: 'crucigrama', group: 'Clásicos', title: 'Crucigrama diario', skill: 'Lenguaje y recuerdos',
    description: 'Crucigrama 7x7 con pistas claras para ejercitar tu vocabulario y memoria.',
    icon: bookOutline, accent: color.coral, available: true,
  },
  {
    id: 'kings-court', group: 'Narrativos', title: "King's Court", skill: 'Decisión y memoria',
    description: 'Elegí a los miembros de tu corte para comenzar la historia.',
    icon: peopleOutline, accent: color.teal, available: true,
  },
];

const groups: { title: GameGroup; description: string }[] = [
  { title: 'Clásicos', description: 'Juegos conocidos para ejercitar lenguaje, memoria y lógica.' },
  { title: 'Narrativos', description: 'Pequeñas historias que invitan a observar, recordar y decidir.' },
  { title: 'Puzzles', description: 'Próximamente.' },
];

// Muestra los juegos y permite abrir sus calendarios.
const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [skill, setSkill] = useState('Todos');
  const skills = ['Todos', 'Memoria', 'Lenguaje', 'Atención', 'Lógica'];
  const matchesSkill = (game: MenuCardGame) => skill === 'Todos' || (skill === 'Lenguaje' ? /vocabulario|Lenguaje/.test(game.skill) : game.skill.toLocaleLowerCase('es').includes(skill.toLocaleLowerCase('es')));
  const [esAdmin, setEsAdmin] = useState<boolean>(esUsuarioAdmin);

  useEffect(() => {
    // Comprueba si la sesión permite mostrar la administración.
    const checkAdmin = () => {
      setEsAdmin(esUsuarioAdmin());
    };
    window.addEventListener('user_progress_updated', checkAdmin);
    window.addEventListener('storage', checkAdmin);
    return () => {
      window.removeEventListener('user_progress_updated', checkAdmin);
      window.removeEventListener('storage', checkAdmin);
    };
  }, []);

  // Abre el calendario del juego elegido.
  const startGame = (id: string) => {
    if (id === 'wordle') navigate('/juegos/wordle');
    if (id === 'sopa-letras') navigate('/juegos/sopa-letras');
    if (id === 'sudoku') navigate('/juegos/sudoku');
    if (id === 'crucigrama') navigate('/juegos/crucigrama');
    if (id === 'kings-court') navigate('/juegos/kings-court');
  };

  return (
    <IonPage>
      <LoginHeader menuPrincipal onUsuarioChange={() => setEsAdmin(esUsuarioAdmin())} />
      <IonContent className="menu-content">
        <main className="menu-shell">
          <header className="menu-heading">
            <div className="menu-heading__brain" aria-hidden="true"><BrainIcon className="" size={48} /></div>
            <div><h1>Un momento para tu mente</h1><p>Elegí un juego. Disfrutá el desafío, a tu ritmo.</p></div>
          </header>
          <div className="menu-filters" role="group" aria-label="Filtrar juegos por habilidad">
            {skills.map(item => <button key={item} type="button" aria-pressed={skill === item} onClick={() => setSkill(item)}>{item}</button>)}
          </div>
          <p className="menu-sr-only" aria-live="polite">{games.filter(matchesSkill).length} juegos disponibles para {skill.toLocaleLowerCase('es')}</p>

          {esAdmin && (
            <aside className="menu-admin" aria-labelledby="menu-admin-title">
              <div className="menu-admin__copy">
                <h2 id="menu-admin-title">Torre de Control Narrativa</h2>
                <p>Rol Administrador</p>
                <p>Configuración completa: universos, personajes, cartas, eventos y desafíos del juego narrativo.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/editor-narrativo')}
                className="menu-admin__action"
              >
                Abrir Editor Narrativo
              </button>
            </aside>
          )}

          {groups.filter(group => games.some(game => game.group === group.title && matchesSkill(game))).map((group) => (
            <section key={group.title} className="menu-section" aria-labelledby={`group-${group.title}`}>
              <h2 id={`group-${group.title}`}>{group.title}</h2>
              {games.some((game) => game.group === group.title) && (
                <div className="menu-grid">
                  {games.filter((game) => game.group === group.title && matchesSkill(game)).map((game) => (
                    <MenuCard game={game} key={game.id} onStart={startGame} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Menu;
