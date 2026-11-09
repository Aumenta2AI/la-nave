# Verificación de Pulpo

## Actualización visual y Academia — 5 de octubre de 2026

- TypeScript y compilación Vite aprobados.
- **5 pruebas E2E aprobadas en 46,0 segundos**, con backend/SQLite reales y proveedores simulados.
- Verificados los tres nuevos especialistas, sus seis PNG RGBA (1254 × 1254), apertura del chat y alternancia de manos al crear/resolver solicitudes.
- Verificado el logo Aumenta2, la navegación Academia y la persistencia del progreso tras recargar.
- Corregido el desbordamiento de navegación en móvil; ancho del documento comprobado en 390 px.
- Inspección visual de biblioteca apoyada en el suelo, cinco escritorios, interfaz morada y Academia en escritorio/móvil.
- Sesiones y perfiles previos se conservan. No se hicieron nuevas llamadas reales de modelo para estos cambios visuales. El estado de la aplicación conserva un aviso previo de límite de uso de Codex; las pruebas simuladas no verifican la cuota disponible.

Capturas: [oficina](docs/evidence/oficina-real.png), [Academia](docs/evidence/academia-real.png), [Academia móvil](docs/evidence/academia-movil.png), [oficina móvil](docs/evidence/oficina-morada-movil.png). Diseño, archivos y prompts: [personajes](docs/PERSONAJES.md).

---

Fecha de entrega: 4 de octubre de 2026 (America/Bogota).

## Resultado

- Comprobación TypeScript: aprobada (`tsc --noEmit`).
- Compilación Vite: aprobada. La advertencia del fondo PNG es esperada: el backend sirve los originales mediante `/assets/`.
- E2E: **4 pruebas aprobadas, 50,4 segundos** en la última ejecución completa, con Chrome y Playwright.
- Codex real: **dos turnos completados con gpt-6-luna, medium, en la misma sesión**, y persistencia del ID comprobada tras reiniciar el backend real.
- Gmail/Drive reales: **pendientes de conectar**. No hay `COMPOSIO_API_KEY` configurada para esta aplicación. No se enviaron correos ni se escribieron documentos externos.

## Pruebas E2E

Las pruebas ejecutan frontend, backend y SQLite reales, con proveedores de Codex/Composio ficticios únicamente en puertos de prueba. Una franja identifica visiblemente el modo simulado. Los datos están separados de `data/`.

| Recorrido | Resultado |
|---|---|
| Oficina, marca Pulpo, doble clic, teclado y chat | Aprobado |
| Inicio y continuación de sesión, esfuerzo persistido | Aprobado |
| Crear agente y escritorio adicional | Aprobado |
| Dos solicitudes: abrir/refrescar conserva la mano; resolver una la mantiene | Aprobado |
| Resolver la última solicitud devuelve la pose normal, también en Pulpo | Aprobado |
| Correo ficticio de contrato hacia Legal y gestión hacia respaldo | Aprobado |
| Repetir revisión no duplica tareas | Aprobado |
| Pedido a Pulpo crea programación persistente | Aprobado |
| Escritura a través de lectura sin aprobación: bloqueada | Aprobado |
| Aprobar dos veces ejecuta una sola escritura | Aprobado |
| Rechazar o pedir cambios no ejecuta la versión anterior | Aprobado |
| Escritura con resultado incierto: no se reintenta; permite registrar comprobación | Aprobado |
| Fallo de lectura conserva el cursor | Aprobado |
| Cola serial y esfuerzo efectivo `low` | Aprobado |
| Crear y descargar archivo de texto | Aprobado |
| Cambiar respaldo conserva exactamente uno y cambia el destino de nuevas tareas | Aprobado |
| Reinicio real del proceso conserva sesión, historial y solicitudes | Aprobado |
| Editar perfil conserva bloque común DOE y preferencias añadidas | Aprobado |
| Petición desde un origen web ajeno: bloqueada | Aprobado |
| Diseño a 1440 px y 390 px | Capturado e inspeccionado |

## Recorrido real de Codex

Codex instalado: `0.160.0`. Administrativo recibió un saludo y luego una pregunta que dependía de la conversación anterior. Respondió correctamente «Te ofrecí ayuda con organización y gestiones generales». Ambos turnos usaron la sesión `01a10a0d-299e-7b23-8040-de8608375782`, conservada en SQLite tras detener y volver a iniciar el backend.

La evidencia está en [codex-real.json](docs/evidence/codex-real.json) y [chat-codex-real.png](docs/evidence/chat-codex-real.png). No se usaron herramientas externas en ese recorrido.

Para repetir un recorrido real con una clave nueva, con Pulpo encendido y Codex autenticado:

```sh
npm run test:codex
```

Este comando hace dos llamadas reales y agrega los mensajes de prueba al chat Administrativo.

## Verificación visual

Se conservaron los PNG actuales por decisión explícita del usuario: oficina espacial, personajes con uniforme blanco y Pulpo blanco/violeta. Difieren del inventario visual original del prompt; no se sustituyeron por los gráficos del ZIP.

Las capas son fondo → silla → personaje → escritorio → controles. Los dos estados de cada personaje comparten tamaño, anclaje y recorte CSS. Cara y mano quedan por encima de la mesa y el cuerpo inferior queda oculto. Los monitores holográficos forman parte del PNG actual y se preservaron sin edición. Pulpo solo aparece en cabecera y tarjeta, nunca como puesto de trabajo.

- [Oficina real](docs/evidence/oficina-real.png)
- [Chat real](docs/evidence/chat-codex-real.png)
- [Oficina E2E](docs/evidence/oficina-e2e.png)
- [Vista móvil](docs/evidence/movil.png)
- [Solicitudes tras reinicio](docs/evidence/reinicio-solicitudes.png)
- [Resultado externo incierto](docs/evidence/aprobacion-incierta.png)

## Pendiente de acceso externo

El código de autorización de Google Super, selección de cuentas, descubrimiento/validación de herramientas y puente de ejecución está implementado. Falta verificarlo con las credenciales y consentimiento del usuario: OAuth, lectura real de recibidos/enviados y documentos, y escritura de una acción autorizada. Las simulaciones no prueban disponibilidad, permisos ni respuestas del servicio real.

## Repetir E2E

```sh
npm run build
npm run test:e2e
```

Requiere Chrome. El informe HTML se regenera en `playwright-report/index.html`, las capturas en `test-results/` y los datos ficticios en `.test-data/`. La aplicación real usa el puerto 3210; los tests usan 3211 y 3212.
## Conexiones Google - 2026-10-05

Diagnóstico real: /api/accounts fallaba porque no había COMPOSIO_API_KEY. Tampoco había COMPOSIO_AUTH_CONFIG_ID. Se creó .env desde la plantilla, sin credenciales; continúa ignorado por Git.

Configuración ahora ofrece Google Super compartido para Gmail, Drive, Sheets y Docs; revisa acceso a Composio y toolkit del Auth Config, lista estados OAuth, permite guardar la cuenta activa para los cuatro servicios y comprobar lecturas. Sheets y Docs requieren un archivo elegido por el usuario; sin ID se muestran pendientes. Las verificaciones no prueban permisos de escritura. Autorización OAuth y prueba real siguen pendientes de credenciales y consentimiento del usuario.

Validación: TypeScript sin errores, build Vite correcto, 6 pruebas E2E aprobadas (49.3 s). La nueva prueba verifica cuenta compartida, estados sin archivo, lectura simulada de cuatro servicios, rechazo de cuenta ajena e IDs inválidos y ausencia de escrituras. Se reinició el servidor local; /api/google/status confirma de forma explícita ambas credenciales ausentes. Los resultados Google de E2E son simulados.

## Sexto personaje y propuestas - 2026-10-05

Se añadió Marketing y ventas con dos PNG transparentes, perfil propio y migración que conserva agentes existentes. Oficina compacta con seis puestos, tres columnas en escritorio y adaptación móvil. Evidencia real: docs/evidence/oficina-seis.png. Configuración contiene propuestas de ClickUp, Higgsfield, Canva y CapCut, explícitamente sin activar. ClickUp y Canva tienen documentación de Composio; Higgsfield tiene API oficial propia; no se verificó integración pública apta para CapCut. La interpretación de los nombres dictados Higgsfield/CapCut continúa pendiente de confirmación del usuario.

TypeScript y build correctos. Seis pruebas E2E aprobadas (51.6 s), incluida la nueva especialista y ambas poses. Servidor reiniciado y comprobado: seis puestos en tres columnas a 1440 px.
