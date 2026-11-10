# Despliegue persistente de La Nave

La interfaz compilada de Vercel no incluye el servidor Express. El servidor requiere un proceso Node 24 permanente y un volumen persistente: SQLite, archivos de agentes y trabajos programados no pueden almacenarse en el disco temporal de una función de Vercel.

## Servidor

El Dockerfile construye la interfaz y el servidor juntos. Ejecutar una sola réplica con un volumen montado en `/var/lib/la-nave` y estos secretos configurados desde el proveedor de alojamiento:

- `NAVE_HOSTED=1`
- `PUBLIC_ORIGIN`: origen HTTPS público exacto, sin ruta, por ejemplo el dominio definitivo de La Nave.
- `NAVE_VAULT_KEY`: 32 bytes aleatorios en hexadecimal, generados con `openssl rand -hex 32`.
- `NAVE_SETUP_TOKEN`: secreto aleatorio de al menos 32 caracteres para crear al primer administrador.

El puerto es 3210, el chequeo de salud es `/healthz`. El proxy debe conservar el encabezado Host del origen público. No activar PULPO_TEST_MODE. No publicar el volumen, los archivos .env ni las claves. No escalar a múltiples réplicas: las sesiones y el ejecutor de tareas siguen siendo de una sola instancia.

La bóveda usa AES-256-GCM en alojamiento, y conserva DPAPI para la instalación local. Los archivos DPAPI no son portables: las conexiones deben volver a configurarse en el servidor. Respaldar el volumen y conservar NAVE_VAULT_KEY por separado.

## Primer acceso

La creación inicial requiere `X-Setup-Token`, además de usuario y contraseña de al menos 12 caracteres. Una vez creado el propietario, el endpoint rechaza nuevas instalaciones. Los demás usuarios entran por `/app`, el propietario por `/admin` y los registros por `/registro`.

## Estado

Este documento y el contenedor preparan el servidor; no constituyen una confirmación de despliegue. Antes de darlo por terminado se debe comprobar persistencia tras reinicio, inicio de sesión, aislamiento entre empresas y acceso a los recursos 3D. Los proveedores y SMTP requieren sus credenciales de producción. Los agentes que dependen de programas CLI requieren que esos ejecutables estén instalados y autorizados en el servidor.
