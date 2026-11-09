# Revisión de estructura SaaS — 27 de octubre de 2026

## Accesos locales
- /admin: entrada al Superadmin; una sesión ordinaria no puede acceder a sus APIs.
- /app: entrada de usuarios. Aumenta2 conserva su oficina; nuevas empresas entran en el portal de configuración aislado.
- /registro: crea empresa y administrador de empresa en una transacción. No concede privilegios de plataforma. Máximo cinco intentos por IP y hora.

## Personalización implementada
Superadmin → Personalización por empresa permite seleccionar empresa y guardar marca, logo, dos colores, bienvenida, idioma preferido y catálogo de personajes (nombre, área, rol, modelo base, color). Cada empresa puede editar su propia configuración desde /app. El logo y colores se muestran en una vista previa. Los ajustes de personajes e idioma son configuración preparatoria: no transforman aún la oficina 3D ni traducen toda la aplicación.

Las credenciales del portal se cifran por empresa/proveedor. Nunca se entregan al navegador, no sustituyen las claves globales y todavía no se usan para ejecutar tareas. Los registros se resuelven desde la empresa de la sesión, no desde un identificador recibido del cliente.

## Base de datos y rendimiento
- Comprobación de la base real: PRAGMA quick_check = ok; journal_mode = wal; 157 registros en el momento de la revisión.
- Se conservan respaldos e integridad de la estructura existente. Las relaciones de registros JSON siguen siendo responsabilidad de la aplicación, no claves foráneas SQL.
- Sentencias SQLite preparadas reutilizadas; busy_timeout de 5 segundos.
- Visor 3D cargado bajo demanda. Paquete principal de aproximadamente 1.101 KB a 387 KB sin comprimir; el coste del visor se descarga al abrir la oficina. Persisten advertencias de tamaño de algunos paquetes y una referencia anterior a oficina-fondo.png.

## Validación
Pruebas de separación de empresas, rechazo de IDs inyectados, empresa suspendida, bloqueo de APIs operativas, creación de cuentas sin privilegio global, integridad y rollback. Navegador real con base aislada: registro, edición y guardado de marca, intento denegado de acceso a /admin.

## Pendientes para vender el SaaS operativo
1. Separar por empresa jobs, conversaciones, agentes, archivos, tareas programadas, solicitudes y sesiones de ejecución. Por ahora las empresas nuevas tienen BLOQUEADAS las rutas de la oficina compartida.
2. Aplicar personalización al visor 3D y a todos los textos de marca; implementar traducciones reales, subida de logos/modelos y controles de tamaño/tipo.
3. Implementar checkout, webhooks firmados, conciliación, cuotas y ciclo de suscripciones. No activar planes por un registro administrativo.
4. Verificar las credenciales reales de proveedores; configurar Composio Auth Config desde panel y persistir resultados de las verificaciones de IA (todavía pendientes).
5. SMTP, verificación de correo, recuperación de contraseña, invitaciones, MFA, despliegue HTTPS, dominio y gestión operativa de respaldos externos.
6. Afiliados: atribución de enlaces, comisiones sobre cobros confirmados y pagos reales.

Esta revisión cubre los módulos modificados de acceso, almacenamiento, administración, personalización y carga inicial. No constituye una auditoría exhaustiva ni una certificación de toda la base de código. El servidor permanece restringido a localhost.
