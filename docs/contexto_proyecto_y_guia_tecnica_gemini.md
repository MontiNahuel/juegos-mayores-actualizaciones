# Mente Activa: Manual Técnico, Arquitectura y Contexto de Desarrollo

> **Documento de Contexto y Transferencia Técnica**  
> **Última actualización:** 9 de octubre de 2026
> **Repositorio:** [juegos-mayores-actualizaciones](https://github.com/MontiNahuel/juegos-mayores-actualizaciones.git)

---

## Estado actual del frontend

El frontend está en la raíz de este repositorio: no hay una carpeta `frontend/` adicional. Es una aplicación Ionic + React + Capacitor con Android ya inicializado.

La navegación se gestiona de forma centralizada con React Router en `src/VISTAS/routes.tsx`:

| Ruta | Vista |
| :--- | :--- |
| `/` | Redirige a `/menu`. |
| `/menu` | Menú principal de juegos. |
| `/juegos/wordle` | Juego Wordle / Palabra del Día. |
| Cualquier otra | Redirige a `/menu`. |

El código de interfaz se organiza bajo `src/VISTAS`:

```text
src/
├── App.tsx                         # Inicializa Ionic y monta las rutas
├── VISTAS/
│   ├── routes.tsx                  # React Router: rutas de la aplicación
│   ├── MENU/
│   │   ├── Menu.tsx                # Datos del catálogo, grupos y navegación
│   │   └── MenuCard.tsx            # Tarjeta reutilizable que recibe contenido por props
│   ├── JUEGOS/WORDLE/WordleGame.tsx
│   ├── COMPONENTS/Icons/Icons.tsx  # Ilustraciones e íconos reutilizables
│   ├── LOGIN/
│   ├── PERFIL/
│   ├── PREJUEGO/
│   └── RESULTADOS/
└── theme/variables.css             # Variables globales de Ionic
```

Las carpetas de vistas aún sin implementación se conservan con archivos `.gitkeep` para mantener la estructura del proyecto.

---

## 1. Visión del Proyecto y Fundamento Neurocognitivo

El proyecto consiste en una plataforma interactiva de estimulación neurocognitiva pensada para adultos mayores, cuyo fin es prevenir y ralentizar el deterioro cognitivo mediante dinámicas lúdicas de alta adherencia y validez ecológica.

### Pilares y Dominios Cognitivos Estimulados
| Dominio Cognitivo | Justificación Clínica | Mecánica / Juego Asociado |
| :--- | :--- | :--- |
| **Velocidad de procesamiento y UFOV** *(Useful Field of View)* | Basado en el ensayo clínico **ACTIVE** del NIH; amplía el campo visual y reduce el riesgo de demencia. | **La Ruta Postal:** Identificar un símbolo central en milisegundos mientras se detecta un buzón en la periferia. |
| **Memoria de Trabajo y Prospectiva** | Retención y ejecución diferida de tareas cotidianas. | **La Despensa y el Mercado:** Memorizar lista de compras, encontrar productos en góndolas y pagar con presupuesto exacto. |
| **Control Inhibitorio y Flexibilidad** | Frenar respuestas automáticas e impulsos; adaptación a cambios de reglas. | **El Semáforo de la Huerta:** Tareas Go / No-Go (tocar fruta sana, frenar ante fruta con gusanos o cambio de consigna). |
| **Lenguaje y Memoria Semántica** | Fomenta la **reserva cognitiva**, factor protector clave frente al Alzheimer. | **El Desván del Recuerdo / Crucigrama:** Completar refranes populares, reconocer objetos tradicionales y pistas cotidianas. |
| **Atención Dividida (Dual-Tasking)** | Realizar dos tareas concurrentes (motora + discriminativa). | **El Director de Orquesta:** Marcar pulso rítmico con una mano y clasificar notas con la otra. |
| **Lógica Visoespacial** | Orientación, ensamblaje y rotación mental. | **El Taller del Restaurador:** Reconstruir mosaicos y platos tradicionales fragmentados. |

### Estrategia de los Clásicos ("El Caballo de Troya")
Para evitar el abandono de la app, se incluyen tres clásicos familiares adaptados:
1. **Wordle ("La Palabra del Día"):** Ejercita memoria verbal y deducción. Adaptado con teclado en pantalla gigante de alto contraste, pistas progresivas y palabras familiares en español.
2. **Sudoku:** Versiones accesibles en 4x4 y 6x6, opcionalmente con símbolos/frutas en lugar de números para evitar intimidación matemática.
3. **Crucigrama:** Cuadrículas compactas (5x5 / 6x6) con definiciones cálidas y cotidianas (evitando tecnicismos enciclopédicos de la RAE).

---

## 2. Arquitectura del Frontend y UI Adaptativa

### Stack Tecnológico
* **Framework:** React 19 + TypeScript.
* **Bundler & Tooling:** Vite 8 con `@vitejs/plugin-react` y `@vitejs/plugin-legacy`.
* **Estilos & Accesibilidad:** Tailwind CSS v4 está disponible vía `@tailwindcss/vite`. El menú actual usa objetos `CSSProperties` y propiedades de Ionic, sin hojas CSS ni clases de Tailwind propias.
* **Capa Móvil & Navegación:** Ionic 9 (`@ionic/react`, `@ionic/react-router`, `ionicons`).
* **Puente Nativo / Runtime:** Capacitor 8 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).

### Navegación y responsabilidades actuales
`App.tsx` solamente inicializa Ionic y renderiza `AppRoutes`. La definición de rutas y los redireccionamientos están concentrados en `src/VISTAS/routes.tsx`; las pantallas no deben crear un `BrowserRouter` propio.

El menú usa `useNavigate` para abrir Wordle. Los nuevos juegos deben agregarse como una vista dentro de `src/VISTAS/JUEGOS/<NOMBRE_DEL_JUEGO>/` y registrar su ruta en `routes.tsx`.

### Arquitectura actual del menú

El catálogo es una composición presentacional y sin backend. `Menu.tsx` conserva el arreglo de juegos, los grupos y la decisión de navegación; `MenuCard.tsx` renderiza cada tarjeta con los datos que recibe por props. Esto permite sumar o mover juegos sin duplicar markup.

```text
games[] en Menu.tsx
        |
        v
grupos "Clásicos" y "Narrativos"
        |
        v
<MenuCard game={game} onStart={startGame} />
        |
        v
startGame("wordle") -> /juegos/wordle
```

El contrato de `MenuCard` es deliberadamente pequeño:

| Prop | Responsabilidad |
| :--- | :--- |
| `game` | Provee `id`, grupo, título, habilidad cognitiva, descripción, ícono, color y disponibilidad. |
| `onStart` | Devuelve el `id` elegido al contenedor para que decida la navegación. |

En el estado actual, **Palabra del día** es el único juego navegable. Sudoku, Crucigrama y La ruta postal se muestran como próximos, por lo que no simulan una funcionalidad inexistente.

### Filosofía de diseño actual

La interfaz busca que el entrenamiento se perciba como una actividad cotidiana, no como una evaluación clínica. Las decisiones de diseño son parte de esa intención:

1. **Azul profundo y sereno:** `#294C6B` ocupa el fondo del catálogo. Da continuidad a la pantalla y evita el estímulo visual excesivo. Las superficies blancas se reservan para lectura y acciones.
2. **Cognición visible, no medicalizada:** el cerebro y los íconos de lenguaje, lógica, lectura o atención señalan qué se ejercita. Cada tarjeta nombra la habilidad antes del título del juego.
3. **Puerta de entrada familiar:** `Clásicos` reúne juegos reconocibles como Palabra del día y Mini-Sudoku. `Narrativos` presenta experiencias contextualizadas que invitan a observar, recordar y decidir.
4. **Jerarquía simple:** cada tarjeta mantiene una franja visual, una explicación breve y una única acción. No hay gradientes decorativos, paneles anidados ni acciones competidoras.
5. **Lectura y toque confiables:** el texto mantiene contraste, tamaños amplios y frases directas. Los botones indican con claridad si un juego está disponible o próximo.

La cabecera web recupera la identidad de ASISTODO, el saludo y los indicadores de racha y puntos. Su función es orientar y reconocer la continuidad de uso sin desplazar el catálogo de juegos.

### Concepto de Adaptive UI (Web vs. APK Nativo)
La aplicación utiliza un único código fuente que adapta su interfaz según el entorno de ejecución:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CÓDIGO FUENTE ÚNICO REACT                       │
├───────────────────────────────────┬────────────────────────────────────┤
│   🖥️ En PC / Laptop (Navegador)   │    📱 En Celular (APK / Móvil)     │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Barra de navegación arriba      │ • Cabecera compacta móvil          │
│ • Enlaces horizontales de menú    │ • Barra de pestañas fijas abajo    │
│ • Contenedor centrado y cómodo    │ • Teclado táctil adaptado (55px+)  │
│ • Sin gestos táctiles forzados    │ • Ocupa el 100% de la pantalla     │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Accesibilidad para Adultos Mayores
1. **Teclado Propio en Pantalla:** Evita que el teclado virtual nativo del teléfono (Gboard/Samsung) tape las casillas del juego.
2. **Alto Contraste y Control de Modo Oscuro:** Se desactivó `dark.system.css` en `src/App.tsx` para evitar que los celulares con modo oscuro activado muestren fondos negros involuntarios. La paleta usa un gris suave (`#f8fafc`) con tarjetas blancas y bordes definidos.
3. **Manejo de Respuestas Hápticas:** Integración con `@capacitor/haptics` para proporcionar vibración sutil al presionar teclas.

---

## 3. Arquitectura de Base de Datos y Backend

El backend se estructura en **FastAPI (Python)** conectado a **MongoDB**.

### Colecciones Diseñadas en MongoDB
1. **`users`:**
   * Perfil del usuario, fecha de alta y preferencias.
   * `streaks`: Contador de días seguidos jugando el desafío diario.
   * `campaign_progress`: Resumen de niveles superados (nivel actual y estrellas obtenidas).
2. **`daily_challenges`:**
   * Calendario de retos diarios (Wordle, Sudoku, Crucigrama).
   * Índice único: `{ game_id: 1, date: 1 }`.
   * Contiene la configuración polimórfica (`config`) con la solución, pistas y dimensiones.
3. **`game_levels`:**
   * Catálogo estático de los 500 niveles del modo campaña por juego.
   * Índice único: `{ game_id: 1, level_number: 1 }`.
4. **`user_attempts`:**
   * Almacena la partida activa o en curso del usuario para poder reanudar el juego sin perder progreso si sale de la app.
   * Guarda los intentos realizados (ej. palabras enviadas en Wordle) y estado (`in_progress` o `completed`).

### Decisión de Persistencia: Descarte del Bucket Pattern
Se evaluó y descartó almacenar los intentos dentro de arrays en el documento de usuario (*Bucket Pattern*):
* **Razón 1:** Evitar operadores posicionales complejos (`$`) al actualizar celdas o letras en tiempo real.
* **Razón 2:** Evitar sobrecarga de tráfico de red (descargar 100 partidas históricas solo para jugar el Wordle de hoy).
* **Razón 3:** Eliminar condiciones de carrera y bloqueos (*locks*) entre juegos simultáneos.
* **Conclusión:** Se aplica **1 documento por partida activa** en `user_attempts`.

---

## 4. Guía Práctica de Ejecución y Despliegue

### 4.1. Levantar en Desarrollo Local (PC)
```bash
npm install
npm run dev
```
Abre en el navegador en `http://localhost:5173`. Para simular la vista móvil en tu PC: pulsa **F12** y activa el modo dispositivo (**Ctrl + Shift + M**).

---

### 4.2. Probar en Celular vía Túnel Público (Sin cables ni Wi-Fi compartida)
Para saltar bloqueos de firewall corporativo o aislamiento de routers (AP isolation):
```bash
npm run tunnel
```
Esto genera un enlace HTTPS público de Cloudflare (`https://xxxx.trycloudflare.com`) accesible desde cualquier teléfono con Wi-Fi o datos 4G/5G.

---

### 4.3. Probar como App Instalada (PWA en Celular)
1. Abre el enlace en Google Chrome en tu celular.
2. Toca el menú de tres puntos (arriba a la derecha).
3. Selecciona **"Instalar aplicación"** o **"Agregar a pantalla principal"**.
4. La app se abrirá a pantalla completa sin la barra de direcciones del navegador.

---

### 4.4. Compilar el APK Nativo de Android

#### Prerrequisitos en la máquina:
* **Android Studio** instalado (con Android SDK en `%LOCALAPPDATA%\Android\Sdk`).
* **Java JDK** (incluido en Android Studio en `jbr/`).

#### Método A: Por Terminal (PowerShell)
```powershell
# 1. Compilar el build web y sincronizar con Android
npm install
npm run build
npx cap sync

# 2. Configurar variables de entorno y compilar APK
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew assembleDebug
```
El archivo compilado queda en:  
📁 `android/app/build/outputs/apk/debug/app-debug.apk`

#### Método B: Vía Android Studio (Visual)
```bash
npx cap open android
```
En Android Studio:
1. Espera a que termine la sincronización de Gradle.
2. Ve al menú superior: **Build > Build Bundle(s) / APK(s) > Build APK(s)** (o dale clic a **Assemble Project**).
3. Haz clic en **locate** en el aviso que aparece al finalizar.

---

### 4.5. Instalación en Teléfonos Xiaomi (HyperOS / MIUI)
Al transferir el `.apk` al teléfono:
1. Permitir *"Instalar aplicaciones de fuentes desconocidas"* para la app donde recibiste el archivo (WhatsApp, Drive o Administrador de Archivos).
2. En la pantalla roja de advertencia de HyperOS con cuenta regresiva de 10 segundos, marcar el casillero *"Soy consciente de los posibles riesgos"* y pulsar **Aceptar**.
3. Si Google Play Protect alerta de *desarrollador desconocido*, seleccionar **"Instalar de todas formas"**.

---

## 5. Próximos Pasos en el Roadmap

1. **Frontend:**
   * Implementar la máquina de estados completa del Wordle (evaluación de letras, diccionario de palabras válidas, animaciones de giro de celdas).
   * Crear el selector de juegos en la pantalla de Inicio (*Crucigrama*, *Sudoku*, *Wordle*).
   * Agregar persistencia local con `localStorage` o Capacitor Preferences para juego offline.
2. **Backend (FastAPI):**
   * Configurar los endpoints `GET /api/challenges/wordle/today` y `POST /api/challenges/wordle/guess`.
   * Poblar la colección `daily_challenges` con un cronograma inicial de palabras curadas.
