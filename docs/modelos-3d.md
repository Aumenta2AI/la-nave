# Modelos de la nave

**Estado actual:** ya se crearon e integraron seis modelos originales por área. Véase [Personajes por área](personajes-por-area.md). Las notas siguientes documentan las iteraciones anteriores y sus limitaciones, ya sustituidas para los directores.

Los GLB locales contienen malla texturizada y esqueleto; se clonan con SkeletonUtils compartiendo geometría y texturas. No se utiliza la fotografía de referencia como fondo de la oficina. Hittan, Donna y el operario base fueron convertidos de los PNG existentes con Magnific/Meshy, 12.000 triángulos objetivo por modelo. Las poses sentadas, el movimiento de trabajo y la mano levantada se calculan sobre sus huesos.

- Hittan: https://www.magnific.com/app/creation/lJVTEt2gv9
- Donna: https://www.magnific.com/app/creation/jUcWfGDLD0
- Equipo: https://www.magnific.com/app/creation/vQyOMBka47
- Textura Tierra: https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg (ejemplos oficiales Three.js).

La variante independiente de diseño no pudo subirse al servicio (transferencias fallidas y HTTP 503); Diseño y Contabilidad utilizan temporalmente la malla femenina de Donna. Los demás operarios comparten la malla del equipo. No son 44 identidades faciales únicas.

La distribución conserva las seis áreas funcionales existentes y añade el puente de Dirección. Es una reconstrucción 3D, todavía no una réplica idéntica del render de referencia. Las sombras se calculan al cargar los modelos para evitar recalcular toda la cubierta en cada fotograma; las pequeñas animaciones no actualizan esas sombras.

Verificación: TypeScript y Vite; pruebas Playwright de oficina, reinicio, cola, aprobaciones, conexiones Google, academia y nave. `scripts/preview-ship.mjs` comprueba 44 modelos cargados y genera capturas de escritorio, Hittan, Donna y móvil. La medición local después de cargar modelos fue de 29 FPS; no constituye una garantía en otros dispositivos.

## Variaciones de tripulación
Cada puesto aplica una combinación estable de tono de piel, cabello, proporciones de cabeza y torso, accesorios y uniforme por área sobre las mallas base. Hittan y Donna mantienen su aspecto original. Se alternan las bases del equipo entre áreas; ya no se asigna la misma apariencia completa a todos los integrantes. Estas son variaciones de las mallas existentes, no 44 rostros esculpidos independientemente ni una clasificación étnica de los personajes. Los directores cuentan con escritorio ejecutivo en U de 5,2 unidades, silla ampliada, detalles dorados, uniforme oscuro y señalización de Dirección de área. Verificados con primeros planos en docs/evidence/crew-*.png y la prueba Playwright de nave.
