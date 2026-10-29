import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { bookOutline, gridOutline, peopleOutline, searchOutline, textOutline } from 'ionicons/icons';
import { BrainIcon } from '../COMPONENTS/Icons/Icons';
import MenuCard, { type GameGroup, type MenuCardGame } from './MenuCard';
import LoginHeader from '../LOGIN/LoginHeader';
import { esUsuarioAdmin } from '../AUTH/authUtils';

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
};

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [esAdmin, setEsAdmin] = useState<boolean>(() => esUsuarioAdmin());

  useEffect(() => {
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

  const startGame = (id: string) => {
    if (id === 'wordle') navigate('/juegos/wordle');
    if (id === 'sopa-letras') navigate('/juegos/sopa-letras');
    if (id === 'sudoku') navigate('/juegos/sudoku');
    if (id === 'crucigrama') navigate('/juegos/crucigrama');
    if (id === 'kings-court') navigate('/juegos/kings-court');
  };

  return (
    <IonPage>
      <LoginHeader onUsuarioChange={() => setEsAdmin(esUsuarioAdmin())} />
      <IonContent style={{ '--background': color.blue } as CSSProperties}>
        <div style={{ background: color.blue, minHeight: '100%' }}>
          <main style={styles.shell}>
            <header style={{ alignItems: 'center', display: 'flex', gap: 13, marginBottom: 30 }}>
              <div aria-hidden="true" style={{ color: color.teal, height: 42, width: 42 }}>
                <BrainIcon className="" size={42} />
              </div>
              <h1 style={{ color: '#FFFFFF', fontSize: 31, lineHeight: 1.18, margin: 0 }}>
                Ejercicios para tu mente
              </h1>
            </header>

            {/* Banner exclusivo para Administradores - NUNCA visible para alumnos */}
            {esAdmin && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  border: '1.5px solid #F59E0B',
                  borderRadius: 20,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  padding: '16px 20px',
                  marginBottom: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#FCD34D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon icon={bookOutline} style={{ fontSize: 24 }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#FCD34D',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}
                      >
                        Rol Administrador
                      </span>
                      <strong style={{ color: '#FFFFFF', fontSize: 16 }}>Torre de Control Narrativa</strong>
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0', lineHeight: 1.3 }}>
                      Configuración completa: universos, personajes, cartas, eventos y desafíos del juego narrativo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/editor-narrativo')}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#0F172A',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 800,
                    padding: '10px 18px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                  className="hover:brightness-110 active:scale-95 transition-all"
                >
                  Abrir Editor Narrativo
                </button>
              </div>
            )}

            {groups.map((group, index) => (
              <section key={group.title} style={{ marginTop: index ? 38 : 0 }}>
                <h2 style={{ ...styles.heading, color: '#FFFFFF' }}>{group.title}</h2>
                <p style={{ ...styles.description, color: '#DCE9F2' }}>{group.description}</p>
                <div className="mt-4 grid grid-cols-1 gap-[18px] md:grid-cols-2">
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
