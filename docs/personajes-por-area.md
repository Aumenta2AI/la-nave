# Seis identidades originales para Pulpo

Generados con la herramienta integrada `image_gen` y convertidos a GLB articulado con Magnific/Meshy 7.1. Cada director utiliza su propio modelo y textura, sin sustituirlo por un recolor de Donna.

| Área | Identidad visual | Archivos |
|---|---|---|
| Administración | Mujer de piel morena, cabello negro largo en coleta alta | [Diseño](../public/models/areas/administrativo.png), [GLB](../public/models/areas/administrativo.glb) |
| Legal | Hombre maduro, barba canosa y gafas rectangulares | [Diseño](../public/models/areas/legal.png), [GLB](../public/models/areas/legal.glb) |
| Diseño | Mujer pelirroja, cabello largo suelto y ondulado | [Diseño](../public/models/areas/diseno.png), [GLB](../public/models/areas/diseno.glb) |
| Soporte | Hombre de cabello negro corto y auricular | [Diseño](../public/models/areas/soporte.png), [GLB](../public/models/areas/soporte.glb) |
| Contabilidad | Mujer de cabello negro largo suelto y gafas ovaladas | [Diseño](../public/models/areas/contabilidad.png), [GLB](../public/models/areas/contabilidad.glb) |
| Marketing | Hombre de piel oscura y cabello rizado | [Diseño](../public/models/areas/marketing.png), [GLB](../public/models/areas/marketing.glb) |

[Prompts completos](personajes-prompts.json). [Registro de modelos](personajes-generacion.json). [Registro de esqueletos](personajes-rigs.json).

Los seis diseños iniciales y los seis GLB se guardan en `public/models/areas/`. Los directores conservan la identidad original. Para los 36 operarios se distribuyen las seis bases y se aplican variaciones suaves de proporciones y uniforme, manteniendo intactos los colores naturales del rostro y del cabello. No se han creado 44 esculturas faciales independientes. Hittan y Donna conservan sus modelos propios. Se mantienen los escritorios ejecutivos en U y las animaciones de trabajo/solicitud.

Coste de conversión informado por Magnific: 6 × 1.160 créditos de modelado + 6 × 120 créditos de rigging = 7.680 créditos. Los conceptos se generaron con la herramienta integrada, sin CLI.

Verificación: TypeScript, compilación Vite y prueba Playwright de carga de los seis GLB diferentes, 44 personajes, órbita con ratón, selección y móvil. Capturas por director en `docs/evidence/crew-*.png`.
