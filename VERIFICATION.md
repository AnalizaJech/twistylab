# Verificación — 28 septiembre 2026

- `npm install`: completado; auditoría sin vulnerabilidades.
- `npm run lint`: sin errores.
- `npm test`: 58 pruebas, 7 archivos, todas pasan.
- `npm run build`: TypeScript strict y Vite completados; manifest y service worker generados.
- `node scripts/verify-puzzles.mjs`: los 16 puzzles generan scrambles y restauran el estado inicial al aplicar el inverso.

Se probó la aplicación real con Playwright en Chromium, en escritorio y viewport móvil de 390×844. Se verificaron hold/release/stop con Space y superficie de puntero, almacenamiento del solve, recarga, ejecución de algoritmos, Undo/Redo y clics nativos del modelo 3D.

En producción bajo `/twistylab/`, se completó un virtual solve mediante los controles de teclado: detección automática de solved, tiempo detenido, movimientos/TPS y persistencia. Se generaron scrambles y se visualizaron Clock y Square-1 con el adaptador Three.js, sin errores de consola.

Se registraron 12 solves adicionales mediante el timer; Ao5 y Ao12 aparecieron. Después de recargar seguían presentes los 13 solves de esta sesión de QA. Con red desactivada, otra recarga mantuvo el timer, generación de scramble, puzzle 3D y datos. Stats, gráficos y el worker de mejores medias funcionaron offline.

La revisión de producción detectó y corrigió la mezcla de módulos DOM con workers de cubing.js en Rollup. La configuración separa los módulos del motor y desactiva las precargas DOM para que los workers funcionen bajo subpaths.

GitHub Pages no se publicó ni se hizo push. El checkout tiene configurado `origin` hacia `AnalizaJech/twistylab`. El workflow, HashRouter y la base `/twistylab/` están preparados y la distribución estática fue probada localmente bajo una subcarpeta. Para publicar, sube los archivos a `main` y selecciona GitHub Actions como fuente de Pages.

Las limitaciones físicas y de modalidades avanzadas están enumeradas en README.md. Los tiempos de QA pertenecen al perfil de navegador de pruebas; el código no incluye datos iniciales ficticios.

## Pulido de interfaz y ampliación

- Selectores accesibles personalizados, interruptor de inspección, control numérico y confirmaciones propias; foco discreto y pestañas con estados accesibles.
- Textareas sin resize, altura fija y scroll interno. Catálogo con un único scroll de resultados, filtros desplegables y solo categorías con puzzles disponibles.
- Español e inglés persistentes; se verificó el cambio y su conservación después de recargar. Compatibilidad con ajustes y backups antiguos.
- Seis movimientos wide, inversos y dobles mediante W + cara / W + Shift + cara / W + Alt + cara. En Chromium se obtuvo `Fw' Bw2 Dw` combinando controles y teclado. Los modificadores táctiles también se comprobaron.
- Kilominx, Redi Cube, Master Pyraminx y Baby FTO: scrambles y modelos lógicos verificados; representación 3D revisada visualmente en Chromium. Redi tiene un adaptador Three.js con 48 stickers orientados. Sus límites mecánicos están documentados.
- Se comprobaron Timer, Playground y Settings a 320, 390, 768, 1024 y 1440 px: sin desbordamiento horizontal. En móvil, editor y guía desplegables, historial de sesión plegable y visor compacto.
- Producción: un solve real de QA se guardó; con la red desactivada, la recarga mantuvo el registro y generó otro scramble, sin alertas ni errores de consola.
- Se añadió actualización de instalaciones PWA y recuperación de módulos cuando una pestaña abierta conserva una compilación anterior.

Capturas de la revisión en `output/playwright/`. No se hizo push ni publicación en esta revisión.
