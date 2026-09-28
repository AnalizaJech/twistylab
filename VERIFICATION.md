# Verificación — 28 septiembre 2026

- `npm install`: completado; auditoría sin vulnerabilidades.
- `npm run lint`: sin errores.
- `npm test`: 42 pruebas, 6 archivos, todas pasan.
- `npm run build`: TypeScript strict y Vite completados; manifest y service worker generados.
- `node scripts/verify-puzzles.mjs`: los 12 puzzles generan scrambles y restauran el estado inicial al aplicar el inverso.

Se probó la aplicación real con Playwright en Chromium, en escritorio y viewport móvil de 390×844. Se verificaron hold/release/stop con Space y superficie de puntero, almacenamiento del solve, recarga, ejecución de algoritmos, Undo/Redo y clics nativos del modelo 3D.

En producción bajo `/twistylab/`, se completó un virtual solve mediante los controles de teclado: detección automática de solved, tiempo detenido, movimientos/TPS y persistencia. Se generaron scrambles y se visualizaron Clock y Square-1 con el adaptador Three.js, sin errores de consola.

Se registraron 12 solves adicionales mediante el timer; Ao5 y Ao12 aparecieron. Después de recargar seguían presentes los 13 solves de esta sesión de QA. Con red desactivada, otra recarga mantuvo el timer, generación de scramble, puzzle 3D y datos. Stats, gráficos y el worker de mejores medias funcionaron offline.

La revisión de producción detectó y corrigió la mezcla de módulos DOM con workers de cubing.js en Rollup. La configuración separa los módulos del motor y desactiva las precargas DOM para que los workers funcionen bajo subpaths.

GitHub Pages no se publicó ni se hizo push. El checkout tiene configurado `origin` hacia `AnalizaJech/twistylab`. El workflow, HashRouter y paths relativos están preparados y la distribución estática fue probada localmente bajo una subcarpeta. Para publicar, sube los archivos a `main` y selecciona GitHub Actions como fuente de Pages.

Las limitaciones físicas y de modalidades avanzadas están enumeradas en README.md. Los tiempos de QA pertenecen al perfil de navegador de pruebas; el código no incluye datos iniciales ficticios.
