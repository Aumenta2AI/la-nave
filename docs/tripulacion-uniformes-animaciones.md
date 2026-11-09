# Tripulación: uniformes, insignias y movimiento (19 octubre 2026)

- Hittan sustituido por un GLB nuevo generado desde una referencia de traje azul rey, camisa blanca, correa y zapatos miel. Se conserva `public/models/hittan-previous.glb` como respaldo.
- Referencia local: `public/models/hittan-royal-reference.png`. Modelo activo: `public/models/hittan.glb`.
- Imagen de referencia creada con imagegen; conversión Meshy 7.1 de 16.000 caras y rig Meshy mediante Magnific. Subida autorizada explícitamente por el usuario. Coste informado por las herramientas: 1.160 + 120 = 1.280 créditos.
- Todos llevan insignia Aumenta2; los siete LLM llevan insignias de proveedor delante y detrás, unidas al esqueleto. Texturas de insignias compartidas para reducir memoria.
- Seis modelos base por oficina, variaciones de cabello y proporciones, gafas opcionales; uniformes blancos con apliques morados. No son 77 esculturas únicas: se reutilizan mallas para mantener el rendimiento.
- Movimientos procedurales suaves e independientes: respiración/lectura, contacto con pantallas y escritura. Son animaciones ambientales; no prueban que una API esté ejecutando una tarea. El estado real sigue llegando del servidor.
- Pausa congela las poses. Solicitudes pendientes interpolan la elevación del brazo.
- Eliminado el respaldo dorado de los puestos de los líderes de pie.
- Cinturón circular con ocho repeticiones de CENTRO DE MANDO; campo de 1.800 estrellas en una esfera completa.
- Pantalla completa nativa, con alternativa expandida si el navegador la rechaza. Se mantiene el inspector del agente dentro del visor.
- Vite ignora los modelos, capturas y temporales para evitar cierres por EBUSY de Windows durante sustituciones de archivos.

## Fuentes
Insignias de proveedores: https://github.com/lobehub/lobe-icons, distribuidas bajo MIT. Licencia conservada en `public/brands/LICENSE-lobe-icons.txt`. Los símbolos identifican a sus respectivas marcas.

## Prompt final de la referencia
Edit reference character into clean full-body professional game character reference for conversion to a 3D mesh. Preserve the recognizable adult man's face, short dark hair and trimmed beard, realistic adult proportions and polished realistic 3D game rendering. Replace ALL clothing with tailored ROYAL BLUE business jacket and matching royal blue trousers, crisp plain WHITE shirt with open collar, HONEY TAN leather belt with small SILVER buckle, HONEY TAN leather dress shoes. Absolutely NO GOLD ornaments, gold piping, military epaulettes, decorations, or jewelry. Jacket slightly open so white shirt and honey belt visible. Smooth clean trouser legs with very few folds, accurate ankles and feet, each foot clearly separated with no crossing or overlap. Arms gently angled away from body in a mild symmetrical A-pose with straight relaxed hands, legs straight and feet shoulder-width apart. Front view, perfectly centered whole body including both shoes with generous margin. Transparent background, no scenery, no desk, no floating screen, no lettering. Preserve likeness. High quality mesh-friendly clean silhouette and even neutral illumination.

## Verificación
TypeScript sin errores; build Vite completado. Prueba Playwright aprobada: 88 modelos, órbita, zoom, selección, cúpula, pantalla completa y ancho móvil. Capturas en docs/evidence/hittan-royal.png, llm-logo.png, uniforms.png y fullscreen.png.
