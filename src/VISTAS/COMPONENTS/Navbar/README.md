# Navbar compartida

`AppNavbar` es la única implementación de `IonHeader`/`IonToolbar`. Menú y calendario usan la identidad oscura del menú: Nunito Sans, fondo azul pizarra, texto claro y acciones con contraste. El contexto de juego conserva por ahora su apariencia clara anterior; su rediseño queda fuera de esta etapa. King’s Court no se modifica.

| Contexto   | Centro                                | Acciones                             |
| ---------- | ------------------------------------- | ------------------------------------ |
| `menu`     | Saludo al usuario en escritorio       | Racha, saldo y acceso/salida         |
| `calendar` | Título del juego                      | Regreso; racha y saldo si hay sesión |
| `game`     | Título, indicadores y puntos animados | Regreso y acciones del juego         |

`NavbarView` es una unión discriminada: título y regreso son obligatorios fuera del menú. `useNavbarSession` concentra lectura de sesión, eventos `storage`/`user_progress_updated`, apertura del modal, login y logout. El saldo siempre proviene de `PlayerEconomyContext`.

El adaptador `GameHeader` conserva las props de los juegos y sus pistas, pero no dibuja otra navbar ni controla la sesión. Calendarios y menú usan `AppNavbar` directamente. `Usuario` se comparte con el modal mediante una importación de tipo para evitar dependencias circulares.

El parámetro `abrirLogin=true` abre el modal y se consume preservando los otros parámetros y el fragmento. Datos de sesión inválidos vuelven al estado invitado. El consumidor recibe `onUsuarioChange` al cambiar el usuario, incluidos los cambios originados en otras pestañas.
