# Pulpo

Tu oficina local de agentes. React y TypeScript, backend Node, SQLite, Codex CLI y Google Super mediante Composio. Conserva los gráficos espaciales actuales de esta carpeta, según tu elección.

La oficina incluye Administrativo, Legal, Diseño, Soporte técnico/atención al cliente y Contabilidad. La cabecera incorpora Aumenta2 y la interfaz utiliza su paleta morada. En **Academia** encontrarás cinco lecciones prácticas, con progreso guardado en el navegador. Consulta [los personajes y sus dos poses](docs/PERSONAJES.md).

## Abrir la oficina

En esta máquina las dependencias ya están instaladas. Desde PowerShell, en esta carpeta:

```powershell
.\iniciar.ps1
```

Abre **http://localhost:3210**. Mantén esa terminal abierta; `Ctrl+C` detiene el backend y las revisiones periódicas. No hay despliegue público.

En otra máquina, instala Node.js 24 o posterior y Codex CLI. Después:

```sh
npm install
codex login
npm start
```

También puedes usar `pnpm install` y `pnpm start`. El lockfile incluido es de pnpm. Un único comando inicia backend y frontend. Para comprobar y generar el frontend de producción: `npm run build`; después configura `NODE_ENV=production` y ejecuta `npm start`.

## Primeros pasos

1. Pulsa **Hablar**, haz doble clic en el personaje o enfócalo y pulsa Enter.
2. Escribe un encargo. Cada agente usa **gpt-6-luna**, sin sustituirlo por otro modelo. El esfuerzo se elige en la cabecera y se aplica al siguiente turno.
3. Abre **Tareas** para ver encargos derivados del correo. Los resultados y archivos descargables aparecen en **Chat**.
4. Usa **Configuración** dentro del chat para editar el perfil, o **Añadir agente** para ampliar el equipo. Para cambiar el respaldo, marca esa opción en otro agente.
5. Las manos y el avatar de Pulpo indican solicitudes pendientes. Abrir el chat no las resuelve. Responde, descarta, aprueba, rechaza o pide cambios.

## Conectar Gmail y Drive

La conexión del plugin de Codex no se comparte automáticamente con este servidor local. La aplicación usa el SDK de Composio desde el backend; no requiere instalar el CLI de Composio.

1. Copia `.env.example` a `.env`.
2. En tu proyecto de Composio obtén una clave API y crea/selecciona un **auth config Google Super** con permisos para los servicios que vas a utilizar.
3. Completa `COMPOSIO_API_KEY`, `COMPOSIO_AUTH_CONFIG_ID` y, si hace falta, `COMPOSIO_USER_ID`. No pegues claves en chats ni perfiles.
4. Reinicia Pulpo. Ve a **Configuración → Conectar Google** y abre el enlace de autorización.
5. Completa el consentimiento en Google. Vuelve a Pulpo, pulsa **Actualizar conexión**, selecciona la cuenta y pulsa **Usar esta cuenta en Google**. Se guarda para Gmail, Drive, Sheets y Docs. Después usa **Comprobar los cuatro servicios**; para Sheets y Docs introduce un ID de archivo accesible. Una cuenta activa no certifica todos los permisos.

Sin estos datos verás **Pendiente de conectar**. No se inventan correos ni resultados. El descubrimiento de herramientas obtiene nombres, versiones y JSON Schemas de Composio en tiempo de ejecución. Las lecturas requieren una herramienta declarada de solo lectura; las demás operaciones piden aprobación. La revisión periódica usa el proxy de solo lectura de Composio con endpoints fijos de Gmail.

## Revisión periódica

Pide a Pulpo «Revisa mi correo cada 30 minutos y reparte los pendientes» o configura el intervalo en Configuración general. El backend guarda la programación real con `node-cron`, revisa vencimientos cada cinco segundos y evita revisiones simultáneas. Funciona con el navegador cerrado mientras el servidor siga encendido.

Al activar por primera vez comienza desde ese momento. Tras una pausa continúa desde el cursor guardado. Para histórico, pide a Pulpo explícitamente una fecha inicial. Revisa tanto bandeja de entrada como enviados, pagina todos los resultados y lee los mensajes completos. Un fallo conserva el cursor; los IDs ya procesados evitan duplicados al reintentar. Los adjuntos se identifican y el agente puede pedir su lectura mediante herramientas descubiertas; no se supone que el cuerpo del correo contiene el contrato adjunto.

## El circuito

**Correo nuevo → Pulpo → asignación con motivo y fuente → cola del especialista → resultado → solicitud de aprobación → ejecución de esa versión.**

Pulpo recibe las especialidades actuales y escoge un responsable. El backend valida el ID y usa el respaldo cuando no corresponde a un agente existente. Los correos informativos se registran sin crear tarea. Cada agente tiene una cola serial y distintos agentes pueden trabajar en paralelo.

Enviar correos o escribir en Drive siempre requiere una solicitud. La solicitud conserva los argumentos exactos, la cuenta y la versión de la herramienta. El backend reclama la ejecución antes de contactar Composio para impedir duplicados por doble clic. Un resultado incierto queda bloqueado: no se repite automáticamente. Verifica el destino y registra la evidencia en la solicitud. Si confirmas que no se ejecutó, se genera una nueva solicitud que necesita una nueva aprobación.

## Dónde están tus datos

- `data/pulpo.sqlite`: perfiles, chats, tareas, solicitudes, colas, sesiones y programación. SQLite usa WAL; realiza copias con el backend detenido, incluyendo archivos auxiliares si existen.
- `data/agents/<id>/AGENTS.md`: instrucciones. El bloque común procede literalmente de `AGENTS-plantilla.md`. Solo el bloque marcado `PULPO:PROFILE` se actualiza al editar el perfil.
- `data/agents/<id>/profile.json`: perfil de cada agente.
- `directives/INDEX.md`, `execution/`, `.tmp/` y `outputs/` dentro de cada carpeta: directivas, herramientas, temporales y entregables.
- `.env`: configuración privada del backend, excluida de Git.

Los IDs de agentes no cambian al renombrarlos. Codex recibe el mensaje por stdin con argumentos separados y `shell:false`. El ID devuelto por `thread.started` se persiste; cada continuación usa `exec resume <ID>`. El ejecutor desactiva shell, búsqueda web y configuración global de herramientas para centralizar servicios externos en el puente. Los archivos de texto solicitados se guardan mediante la acción controlada `file`.

Las llamadas a herramientas se expresan en un protocolo JSON validado por el backend. Esto permite terminar el proceso de Codex al pedir aprobación y retomar su misma sesión cuando llega la respuesta. No hay un sistema propio de compactación.

## Pruebas y límites verificados

```sh
npm run build
npm run test:e2e
```

Las E2E usan Chrome instalado, SQLite y servidores reales en puertos 3211 y 3212, con datos aislados en `.test-data/`. Solo Codex y servicios externos se simulan. Si Chrome no está instalado, instala un navegador de Playwright y ajusta `launchOptions.channel` en `playwright.config.ts`.

El informe HTML queda en `playwright-report/index.html` y las capturas en `test-results/`. Consulta `INFORME-PRUEBAS.md` para distinguir el recorrido real de Codex de las simulaciones.

La integración OAuth, lecturas reales de Gmail/Drive y escrituras autorizadas quedan pendientes de una conexión Composio propia. No se enviaron correos de prueba reales. Los gráficos actuales contienen monitores holográficos: se preservaron sus píxeles; las capas sitúan silla y personaje detrás de la mesa.

## Referencias utilizadas

- [Codex no interactivo](https://learn.chatgpt.com/docs/non-interactive-mode)
- [Herramientas del SDK de Composio](https://docs.composio.dev/reference/sdk-reference/typescript/tools)
- [Conexiones del SDK de Composio](https://docs.composio.dev/reference/sdk-reference/typescript/connected-accounts)
- [Google Super](https://docs.composio.dev/toolkits/googlesuper)
