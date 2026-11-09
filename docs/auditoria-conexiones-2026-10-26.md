# Auditoría de conexiones — 26 de octubre de 2026

## Comprobado en esta instalación
- Sin credenciales configuradas para Stripe, PayPal y Mercado Pago.
- Sin acceso configurado para los once proveedores del catálogo: Vercel, Apify, Composio, OpenAI, Claude, Grok, Kimi, DeepSeek, Perplexity, Gemini y Croma.
- Google Login y COMPOSIO_AUTH_CONFIG_ID sin configurar.
- Esto verifica presencia de configuración local; no es una certificación de permisos o funcionamiento externo.

## Implementado y probado
- Formularios protegidos de pasarelas, claves cifradas por Windows DPAPI, separación test/live, sustitución y eliminación explícita. No se devuelven claves al navegador.
- Verificaciones: Stripe GET /v1/balance, PayPal OAuth client_credentials, Mercado Pago GET /users/me. Sin cobros. En Mercado Pago la prueba no certifica el entorno de la cuenta.
- Panel de auditoría con catálogo de proveedores IA y sus controles existentes. La prueba LLM consume un mensaje; MCP consulta herramientas. Los resultados de IA no persisten al reiniciar.
- Afiliados aprobados, referencias únicas por empresa, porcentaje conservado al asignar, pagos externos con comprobante único, totales separados por moneda.
- Gráficos temporales, carga por agente, distribución por proveedor y nuevos usuarios. No se inventan ingresos, tokens, MRR, conversión o retención cuando no hay fuente de datos.
- Diez pruebas automatizadas aprobadas. Verificaciones de pasarela con respuestas simuladas; NO pruebas de cuentas reales.
- Navegador real con datos aislados: inicio de sesión, guardado cifrado de credencial ficticia, referencias y filtro de siete días.

## Pendiente antes de comercializar
- Configurar credenciales reales desde el panel y verificar los permisos de cada cuenta.
- Checkout, verificación de firmas de webhooks, idempotencia de eventos, conciliación y ciclo de suscripción.
- Enlaces públicos de afiliados, atribución automática, generación de comisiones sobre cobros confirmados y ejecución de transferencias.
- Bolt, Wompi y Gmail SMTP no están implementados.
- Aislamiento operativo por empresa y cuotas efectivas; los planes siguen siendo borradores.
- La autenticación Google requiere configuración OAuth y prueba de redirección real. Composio requiere también Auth Config y autorización de las cuentas de aplicaciones.

## Referencias oficiales
- https://docs.stripe.com/api/balance/retrieve
- https://developer.paypal.com/api/rest/authentication/
- https://www.mercadopago.com.co/developers/en/reference
- https://www.mercadopago.com.co/developers/en/docs/checkout-api-orders/resources/credentials
