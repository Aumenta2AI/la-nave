# Estado SaaS — 28 de octubre de 2026

## Accesos
- /admin: Superadmin protegido por permisos de plataforma en el servidor.
- /app: acceso a la empresa. Aumenta2 conserva su oficina existente.
- /registro: creación transaccional de empresa y administrador sin privilegios globales.

## Disponible para empresas nuevas
- Marca, logo por URL, colores, bienvenida y catálogo editable de personajes.
- Oficina 3D propia, con hasta 12 áreas, navegación por área y selección de personajes.
- Conversaciones con proveedor y modelo elegidos por personaje; claves cifradas por empresa. No se usan las claves globales como alternativa.
- Historial y registros de ejecución separados por empresa, máximo cuatro conversaciones simultáneas y una por personaje.
- El servidor determina la empresa desde la sesión y rechaza empresas suspendidas.

## Validación
Compilación TypeScript y Vite, pruebas automatizadas de autenticación, separación de empresas, rollback e integridad SQLite, Superadmin y pagos. Navegador real con datos de prueba aislados: registro, marca, visor 3D, conversación sin credenciales rechazada, acceso a Superadmin denegado, formularios de pagos, afiliados y analíticas.

## Límites antes de comercializar
- Las conversaciones no ejecutan herramientas externas. Faltan ejecución multiempresa de archivos, solicitudes, automatizaciones y tareas programadas, recuperación de trabajos tras reinicios y cuotas de consumo por plan.
- Los modelos conservan sus texturas base. Falta rebranding completo de uniformes, traducción integral y carga validada de modelos/logos.
- Pagos: formularios cifrados y comprobaciones de conexión; faltan checkout, webhooks firmados, conciliación y ciclo de suscripciones. Los registros de pagos a afiliados no transfieren dinero.
- Faltan verificación con credenciales reales, configuración de SMTP y Google, verificación de correo, MFA, despliegue HTTPS y pruebas operativas de restauración.
- La base SQLite usa WAL y sentencias preparadas; las relaciones JSON dependen de la aplicación. No es arquitectura distribuida.

El servidor local sirve para revisión. Las pruebas con proveedores simulados no certifican conexiones reales ni constituyen una auditoría exhaustiva de seguridad.
