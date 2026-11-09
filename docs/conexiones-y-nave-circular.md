# Nave circular y conexiones

## Cubierta

14 áreas: Dirección, Orquestadores, LLMs y 11 equipos operativos. Hay 88 personajes: Hittan y Donna, 9 proveedores y 77 integrantes de los equipos. Los perfiles anteriores de Diseño y sus conversaciones se conservan en el directorio, fuera de esta cubierta.

Los directores están al frente, de pie, con escritorio U elevado. Los seis asesores quedan detrás. Dirección usa un puente elevado; Hittan, Donna, Apify, Composio y los siete LLMs usan tótems de tres pantallas, sin sillas. Los proveedores forman un anillo mirando al centro. El botón Cerrar cúpula/Abrir nave controla la cubierta.

Todos los ocupantes usan mallas GLB articuladas. Se reutilizan seis modelos base con variantes de uniforme y proporciones para mantener el peso; no son 88 esculturas distintas. Hittan y Donna tienen modelos propios. Los monitores tienen ilustraciones temáticas generadas en canvas y conservan la proporción 2:1. El metal utiliza una textura compartida pequeña.

## Configuración local

Abre http://localhost:3210 → Configuración → Conexiones de IA. Guarda la clave de cada proveedor y el ID exacto de un modelo disponible en esa cuenta. Perplexity utiliza un preset de Agent API: fast, low, medium, high o xhigh. Las claves se guardan únicamente en `.env` local, excluido de Git; los endpoints de estado nunca las devuelven.

Una clave guardada no equivale a una conexión verificada. Probar respuesta hace una llamada corta al LLM, que puede consumir saldo. Verificar MCP inicializa el servidor y enumera sus herramientas. Sin clave/modelo, el chat informa el bloqueo; no sustituye silenciosamente el proveedor por Codex.

| Personaje | Conexión | Variables |
|---|---|---|
| ChatGPT / OpenAI | Responses API | OPENAI_API_KEY, OPENAI_MODEL |
| Claude | Messages API | ANTHROPIC_API_KEY, ANTHROPIC_MODEL |
| Grok | Chat Completions | XAI_API_KEY, XAI_MODEL |
| Kimi | Moonshot Chat Completions | MOONSHOT_API_KEY, MOONSHOT_MODEL |
| DeepSeek | Chat Completions | DEEPSEEK_API_KEY, DEEPSEEK_MODEL |
| Perplexity | Agent API | PERPLEXITY_API_KEY, PERPLEXITY_MODEL (preset) |
| Gemini | generateContent | GEMINI_API_KEY, GEMINI_MODEL |
| Apify | MCP Streamable HTTP | APIFY_TOKEN |
| Composio | Sesión Tool Router + MCP | COMPOSIO_API_KEY, COMPOSIO_USER_ID |
| Licitaciones / Croma | REST SECOP + MCP | CROMA_API_KEY |

Los LLMs mantienen hasta los últimos 20 mensajes en el contexto enviado y conservan el historial completo localmente. El canal LLM genera texto; las herramientas externas pasan por el motor de orquestación. Apify y Composio usan Codex para interpretar el encargo y sus servidores MCP para ejecutar las herramientas. Esto requiere que el motor Codex local también esté disponible. Las ejecuciones MCP se preparan como Solicitudes con argumentos visibles y se ejecutan tras su aprobación; no se reintentan automáticamente si el resultado es incierto. La autorización de Google/ClickUp y otras cuentas de Composio sigue siendo necesaria por separado.

En Licitaciones escribe `/buscar software educativo`, o utiliza el buscador Croma en Configuración. Devuelve datos reales de SECOP con fecha de actualización, estado y enlace al proceso. No presupone que todos los resultados estén abiertos.

Pausar nuevos encargos impide recibir trabajo nuevo y detiene la cola después del turno activo; no cancela una ejecución en curso. Activar agente reanuda la cola.

## Firebase desde cero

1. Crear un proyecto en https://console.firebase.google.com con la cuenta propietaria.
2. Registrar una app web; copiar apiKey, projectId, authDomain y appId en la sección Firebase de Pulpo.
3. Habilitar Authentication → Google y agregar localhost a los dominios autorizados.
4. Crear Firestore y publicar `firebase/firestore.rules`. Las reglas restringen los mensajes a su usuario autenticado.
5. Guardar e iniciar sesión con Google desde Pulpo. Usar Respaldar conversaciones para copiar mensajes a `users/{uid}/messages/{id}`.

El proyecto remoto no se crea automáticamente ni se activan gastos. El respaldo implementado es manual, conserva la copia local y no restaura ni sincroniza automáticamente cambios desde otros equipos. Las reglas están preparadas en el repositorio, pero deben publicarse en el proyecto real. El inicio de sesión de Firebase sirve para el respaldo, no convierte este servidor localhost en un servicio multiusuario público.

## Fuentes de la implementación

- https://developers.openai.com/api/docs/guides/text
- https://platform.claude.com/docs/en/api/messages/create
- https://docs.x.ai/developers/rest-api-reference/inference/chat-completions
- https://platform.kimi.ai/docs/api/chat
- https://api-docs.deepseek.com/api/create-chat-completion/
- https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/overview
- https://ai.google.dev/api/generate-content
- https://docs.apify.com/mcp
- https://docs.composio.dev/reference/api-reference/tool-router/postToolRouterSession
- https://docs.usecroma.com/mcp-server
- https://docs.usecroma.com/guides/colombia/secop
- https://firebase.google.com/docs/web/setup

## Verificación

`node --experimental-strip-types --test tests/providers.unit.mjs` verifica adaptadores con respuestas controladas, migración idempotente, ausencia de claves en estado y validación MCP. Las pruebas de navegador están en `tests/ship.spec.ts` y `tests/providers.spec.ts`. Estas pruebas no acreditan autenticación real ni saldo de los proveedores.
