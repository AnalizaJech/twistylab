# TwistyLab

Un espacio de práctica de speedcubing que funciona en tu navegador: cronómetro, scrambles reales, puzzles 3D, simulador interactivo, resolución virtual, sesiones y estadísticas. Sin cuenta ni servidor para las funciones principales.

## Empezar

Requiere Node.js 22.3 o superior. Desde esta carpeta:

```sh
npm install
npm run dev
```

Abre la URL que muestra Vite. En Timer, mantén **Space** hasta READY, suelta para empezar y vuelve a pulsar para detener y guardar. En móvil, mantén la superficie del cronómetro y suelta; toca para detener. Puedes activar inspección de 15 segundos en Settings.

```sh
npm test
npm run lint
npm run build
npm run preview
node scripts/verify-puzzles.mjs
```

## Funcionalidad

- 2×2 hasta 7×7, Pyraminx, Megaminx, Skewb, Square-1, Clock y FTO.
- Selección por búsqueda, categorías, favoritos y recientes. El puzzle, evento y sesión permanecen seleccionados entre módulos y recargas.
- Cronómetro determinista con `performance.now()`, refresco RAF, hold configurable, inspección y penalizaciones +2/DNF; precisión de dos o tres decimales.
- Scrambles de `cubing/scramble`, sin generadores aleatorios caseros. La generación costosa usa los workers internos de cubing.js.
- Vista 3D con órbita, zoom, presets de cámara, fullscreen y reproducción de scrambles paso a paso.
- Playground: notación validada por `Alg` y `KPuzzle`, movimiento animado, historial, Undo/Redo, copiar y limpiar historial conservando la posición, reset y scramble.
- Resolución virtual: genera un scramble, pulsa Start, resuelve mediante teclado, controles de movimientos o clics de cara cuando están disponibles. La detección de solved detiene y guarda el solve, con movimientos y TPS.
- Teclas configurables. Por defecto R/U/F/L/D/B, Shift para inverso, Alt para doble; M/E/S y x/y/z cuando el puzzle admite la notación. Los movimientos wide se pueden introducir como algoritmos.
- Sesiones independientes; historial con penalizaciones, notas, borrado confirmado y replay del scramble.
- Mo3; Ao5/Ao12/Ao25/Ao50/Ao100; mejores medias, PB por evento y sesión; gráficas de tiempos y medias móviles. Mejores medias calculadas en un worker separado.
- Persistencia Dexie/IndexedDB; exportación CSV y backup JSON de sesiones, solves, settings, favoritos y keybindings. Importación validada y transaccional, con confirmación explícita antes de reemplazar IDs coincidentes o preferencias.
- Modo dark/light/system, adaptación móvil, navegación accesible, foco visible y reducción de movimiento.
- PWA: producción precachea las rutas, assets, motores, módulos de puzzles y scramblers. Después de completar la primera instalación de caché, funciona sin conexión. No requiere fuentes ni CDN remotos.

## GitHub Pages

Publica **el contenido de esta carpeta como raíz del repositorio**. El workflow `.github/workflows/deploy.yml` instala desde lockfile, ejecuta tests, compila y publica `dist`.

1. Sube el proyecto a GitHub, rama `main`.
2. En **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
3. Ejecuta el workflow o haz push a `main`.

`base: './'` permite cargar assets bajo `https://USERNAME.github.io/REPOSITORY/` sin conocer el nombre del repositorio. HashRouter usa `/#/timer`, `/#/playground`, `/#/stats`, `/#/history` y `/#/settings`, evitando redirecciones del servidor. Los workers se crean mediante URLs de módulos procesadas por Vite. La PWA tiene scope y start URL relativos al repositorio.

Para comprobar localmente el resultado bajo una subcarpeta:

```sh
npm run build
node scripts/preview-subpath.mjs
```

Abre `http://127.0.0.1:4173/twistylab/`. Este servidor es únicamente una herramienta de verificación local; producción es completamente estática.

## Arquitectura

| Carpeta | Responsabilidad |
| --- | --- |
| `src/app` | Shell, tabs y routing lazy |
| `src/components` | Selector, viewer, sesiones y componentes compartidos |
| `src/features` | Workspaces de timer, playground, stats, history y settings |
| `src/core/puzzles` | Registro central, modalidades y controlador interactivo |
| `src/core/timer` | Máquina de estados y cálculo de tiempo independiente de React |
| `src/core/statistics` | Medias, DNF/+2 y formato de tiempo |
| `src/core/storage` | Esquema Dexie, repositorios, backup, validación e import/export |
| `src/core/controls` | Chords de teclado y asignaciones por defecto |
| `src/core/scramble` | Adaptador de scrambles oficiales de cubing.js |
| `src/engines/cubingjs` | Modelo lógico KPuzzle e historial independiente del renderer |
| `src/engines/threejs` | Adaptador 3D para Clock y Square-1 |
| `src/stores` | Stores separados de puzzle, timer, settings y sesión |
| `src/workers` | Cálculos de mejores medias fuera del hilo principal |
| `src/test` | Pruebas de dominio, persistencia, capacidades y controles React |

Los componentes acceden a IndexedDB a través de repositorios y stores. `InteractivePuzzleController` dirige el modelo de dominio; el renderer consume setup e historial. Los movimientos nativos de cubing.js se incorporan al mismo historial. Al desmontar se retiran listeners, se detiene playback/RAF y el adaptador Three.js libera geometrías, materiales y contexto WebGL.

## Añadir un puzzle

1. Añade un `PuzzleDefinition` en `src/core/puzzles/registry.ts`, con categoría, ID de cubing.js, evento de scramble, capacidades y movimientos válidos.
2. Añade las `CompetitionMode` correspondientes sin duplicar el puzzle. Para nuevos scramblers, crea otro adaptador en `core/scramble`.
3. Usa `renderer: 'cubing'` siempre que exista un renderizador suficiente. Para un puzzle especial, implementa un adaptador de renderizado registrado, conservando `PuzzleEngine` como contrato del modelo.
4. Añade pruebas de carga, movimientos, inversión y solved. Comprueba export/import si añades datos al esquema.

La categorización ya contempla NxNxN, Minx, Pyramidal, Shape Mods, Cuboids, Corner Turning, Edge Turning, Experimental y Legacy. Los futuros puzzles no se presentan como disponibles hasta que tienen un motor funcional.

## Matemática de las estadísticas

Se ordenan los últimos N tiempos efectivos y se descarta el `ceil(N × 0.05)` más rápido y más lento. +2 se suma antes del cálculo; DNF se representa como infinito, nunca como cero. Ao5 y Ao12 toleran un DNF, mientras que dos resultan en DNF. Mo3 no descarta extremos. Las medias se filtran por sesión, puzzle y modalidad. Los tiempos almacenados son milisegundos sin redondear; la visualización trunca a la precisión configurada.

## Límites conocidos

- cubing.js expone interacción experimental por clic de cara y órbita; **arrastrar una capa directamente no está implementado**. Usa clics, teclado o el panel de movimientos. La interacción por clic depende del soporte de PuzzleGeometry de cada puzzle.
- Clock y Square-1 no tienen renderer 3D nativo en la versión fijada. El adaptador Three.js usa el estado KPuzzle y meshes propios. Clock muestra diales y reverso; los pines son visuales, no un mecanismo físico editable. Square-1 representa wedges y cambios de forma, pero sus transiciones de slice son interpolaciones, no una simulación mecánica con colisiones o bloqueo de cortes ilegales.
- La detección solved usa cubing.js cuando existe y comparación de estado por defecto como alternativa. Clock comprueba todos los diales e ignora la orientación del marco. Algunas orientaciones globales de puzzles no cúbicos pueden necesitar volver a la orientación inicial.
- Las modalidades OH/blind/FMC/multi-blind se separan por evento y scramble; esta versión registra tiempos. No implementa puntuación de FMC, múltiples cubos ni flujo reglamentario completo de blind/multi-blind.
- Un algoritmo se valida antes de aplicarlo. Notación de cubing.js no equivale a validación de restricciones físicas de todos los puzzles especiales.
- La sesión y el historial sobreviven a recargas, pero el estado de Free Play se reinicia al salir del módulo. Exporta backups antes de limpiar datos del navegador.
- Un solve se considera terminado en el estado lógico del motor; la última animación puede seguir unos instantes después de detener el timer virtual.
- No hay sincronización entre dispositivos, hardware Stackmat/Bluetooth ni solver automático. Los navegadores pueden eliminar la caché o almacenamiento local por políticas de espacio; conserva backups.
- Los motores WebGL/WASM generan chunks grandes lazy. Es una advertencia de tamaño de Vite, no un fallo de build. La descarga inicial de la PWA incluye aproximadamente 3 MB sin comprimir de assets.

## Fuentes técnicas

[cubing.js](https://js.cubing.net/), [TwistyPlayer](https://js.cubing.net/cubing/twisty/), [scrambles](https://js.cubing.net/cubing/scramble/) y sus tipos incluidos en el paquete instalado. Las APIs experimentales se encapsulan en los adaptadores para facilitar futuras actualizaciones.
