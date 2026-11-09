# Nuevos especialistas y actualización visual

Entrega: 5 de octubre de 2026. Generados con **ImageGen integrado**, fondo transparente, sin API/CLI alternativo. Los seis PNG finales están en la raíz del proyecto; cada pareja tiene lienzo RGBA de 1254 × 1254, con la misma escala y anclaje en la aplicación.

| Agente | Dirección de personaje | Pose normal | Pide atención |
|---|---|---|---|
| Diseño | Creativa con cabello corto rizado, detalle violeta, gafas redondas, stylus y pin de color. | [diseno-normal.png](../diseno-normal.png) | [diseno-mano-levantada.png](../diseno-mano-levantada.png) |
| Soporte | Especialista cercano, auricular violeta con micrófono y emblema de circuitos. Soporte técnico y atención al cliente. | [soporte-normal.png](../soporte-normal.png) | [soporte-mano-levantada.png](../soporte-mano-levantada.png) |
| Contabilidad | Profesional con cabello recogido, gafas rectangulares y distintivo de calculadora. | [contabilidad-normal.png](../contabilidad-normal.png) | [contabilidad-mano-levantada.png](../contabilidad-mano-levantada.png) |

Las poses de atención se generaron editando cada pose normal, pidiendo conservar identidad, uniforme, posición, escala y transparencia y cambiar solo el brazo derecho para levantar la palma junto al rostro. Los prompts completos están en [prompts-personajes.json](prompts-personajes.json).

## Integración

Los agentes se añaden una sola vez mediante una migración, con IDs `diseno`, `soporte` y `contabilidad`. Se conservan los perfiles, sesiones, conversaciones y respaldo existentes. Sus especialidades se incluyen en la lista que Pulpo consulta para asignar encargos. Las tres apariencias también están disponibles en Configuración de agentes.

El personaje de Diseño representa a un agente de dirección visual y briefs. Su aspecto no implica incorporar un proveedor adicional de generación de imágenes a la aplicación: siguen aplicándose las herramientas disponibles del backend.

## Interfaz

- Morado Aumenta2 `#7643a6`, tonos lavanda y superficies plateadas; colores cálidos reservados para solicitudes y errores.
- Logo original copiado sin modificar a `aumenta2-logo.png`, junto a Pulpo en la parte superior izquierda.
- Biblioteca con escala mayor, sombra de contacto y apoyo en el suelo. La unión entre pared y piso permanece fija cuando se agregan filas de escritorios.
- Academia: cinco lecciones de uso, ejemplos, enlaces a las funciones y progreso persistido en el navegador. No ejecuta los ejemplos automáticamente.

La solicitud de video quedó excluida por confirmación del usuario. Se mantuvo la estética espacial actual y se tomó el logo como referencia de color; no se aplicó un sistema Keystone externo.
