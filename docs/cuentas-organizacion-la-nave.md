# La Nave: organización y conexiones

## Oficina

El botón «Añadir agente o departamento» distingue ambos procesos. Un departamento nuevo crea un líder y seis asesores; la cubierta redistribuye sus oficinas en círculo y amplía su radio. Un agente nuevo requiere departamento. Su perfil permite cambiarlo de área manteniendo el mismo identificador, conversaciones y tareas. Configuración permite editar nombre, temática, modelo del líder y color del departamento. Límites actuales: 24 departamentos y 18 asesores por área.

Vercel se incorpora como tercer orquestador, junto a Composio y Apify. La cubierta inicial contiene 89 personas. Los nombres internos de la base de datos se conservan para evitar perder información al cambiar la marca a La Nave.

La Academia contiene 15 lecciones con buscador y progreso local: navegación, dirección, encargos, organización, cuentas, orquestadores, Croma, aprobaciones y un ejemplo de trabajo entre áreas. La coordinación descrita distingue los pasos manuales de las acciones que realmente ejecuta el sistema.

## Accesos por personaje

Selecciona el personaje → Conexión del personaje, o abre su conversación → Configuración. También están centralizados en Configuración → Conexiones de IA.

- ChatGPT: acceso mediante el cliente oficial Codex con una sesión dedicada a La Nave. El modo cuenta no cambia silenciosamente a una API facturada. Requiere un plan y acceso compatibles. No importa conversaciones anteriores de ChatGPT.
- Claude: acceso mediante el cliente oficial Claude Code, también con sesión dedicada. Los límites dependen del plan y las condiciones vigentes. No importa conversaciones anteriores de Claude.
- Los dos ofrecen un modo API explícito, con clave y modelo separados.
- Grok, Kimi, DeepSeek, Perplexity y Gemini: integración API con clave y modelo/preset. El enlace a su web permite registrarse, pero abrirla no conecta su suscripción al backend. No se implementó una transferencia de saldo de suscripciones web.
- Apify: autorización OAuth con PKCE y estado vinculado al navegador, o token API. Los tokens se conservan en el servidor. Las herramientas se descubren por MCP.
- Composio: clave del proyecto; después autorización de cada aplicación (Google, Gmail, Drive, Sheets, Docs, ClickUp). Las cuentas conectadas pertenecen al usuario local configurado. Conectar Composio no autoriza automáticamente todas las aplicaciones.
- Croma: clave API desde el líder de Licitaciones Públicas. Consultas SECOP y herramientas MCP utilizan los permisos de esa cuenta.
- Vercel: token personal o de equipo en su panel. REST permite listar proyectos/despliegues, consultar un despliegue y preparar uno desde GitHub. Las ejecuciones pasan por Solicitudes. El despliegue predeterminado es preview; producción requiere indicarlo. No se presenta como acceso MCP OAuth: Vercel exige aprobación de clientes MCP.

Guardar una credencial no prueba su validez. Usa Verificar/Probar y revisa el resultado. Las pruebas de respuesta consumen uso de la cuenta elegida. No se han realizado inicios de sesión ni despliegues reales en nombre del usuario durante esta implementación.

## Logos sobre la ropa

Se eliminó la geometría de placas flotantes. Los logos se componen dentro del material de la malla, en coordenadas de la prenda que siguen su articulación. Aumenta2 usa el isotipo suministrado en el pecho izquierdo; los siete LLM añaden su marca en pecho y espalda. La iluminación y el sombreado siguen siendo los del material de la ropa.

## Fuentes oficiales

- [Codex con tu plan ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
- [Claude Agent SDK y planes](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [CLI de Claude](https://code.claude.com/docs/en/cli-reference)
- [Apify MCP](https://docs.apify.com/mcp)
- [Autorización de Composio](https://docs.composio.dev/docs/authentication/manually-authenticating)
- [Vercel REST](https://vercel.com/docs/rest-api) y [Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp)
- [Croma MCP](https://docs.usecroma.com/mcp-server)

La disponibilidad de los planes y métodos de autorización puede cambiar. Las pruebas locales verifican el código y la interfaz; la autorización real depende de cada cuenta.
