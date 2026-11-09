# Seguridad local: primera etapa

- API limitada a localhost; cabeceras contra inclusión en marcos y detección MIME, sin caché en API.
- Bloqueo de Fetch Metadata cross-site y límite global local de 120 mutaciones/minuto.
- Registro en SQLite: método, ruta, estado, fecha. Sin cuerpos ni claves; actor local no autenticado. No es un registro inalterable.
- Nuevas claves guardadas desde Conexiones: DPAPI CurrentUser. El usuario de Windows puede descifrarlas; esto no protege contra malware ejecutado bajo ese mismo usuario.
- Claves antiguas: volver a guardarlas desde Conexiones para migrarlas. Tokens Apify y sesiones oficiales siguen pendientes de migración. No copiar secretos al chat.
- Copias SQLite mediante backup online (incluye WAL), comprobadas con integrity_check. Al iniciar y cada 24 horas con el proceso activo; conserva 14.
- Copia manual: node --experimental-strip-types scripts/backup.mts
- Consultar copias: GET /api/security/backups. Crear: POST /api/security/backups con JSON {}.
- Las copias están en data/backups, sin cifrado adicional. No incluyen resultados, archivos de conocimiento fuera de SQLite, modelos ni credenciales.
- Recuperación: detener La Nave, preservar íntegra la carpeta data original, validar una copia en una carpeta nueva con DATA_DIR y comprobar sus registros antes de reemplazar nada. No superponer una copia con WAL/SHM de otra base. Las pruebas verifican recuperación de registros en una base independiente.
- DPAPI queda vinculado a la cuenta Windows: no basta copiar credentials.dpapi a otra computadora. Volver a autorizar conexiones en el nuevo equipo.

Pendiente antes de publicar: autenticación, sesiones, permisos, aislamiento de empresas, cifrado de datos/copias externas, retención/borrado, restauración integral, auditoría atribuible, límites económicos por agente y pruebas adversariales.

## Correcciones de continuidad
- Bloqueo exclusivo del proceso por carpeta real de datos. En Windows usa una tubería con nombre liberada por el sistema al terminar el proceso. Las instancias antiguas anteriores a esta protección deben cerrarse antes de adoptar la versión nueva.
- Las tareas y copias periódicas solo arrancan tras abrir correctamente el puerto HTTP.
- Excepción Fetch Metadata limitada a navegación GET de documento en el retorno Apify. Se mantienen PKCE, cookie y validación de estado. No se ha validado una autorización real con la cuenta del usuario.
- El contexto de conocimiento ya se conserva al preparar un encargo MCP.

## Acceso local implementado
Primer inicio: crear usuario administrador (mínimo 12 caracteres de contraseña). Scrypt con sal individual; sesiones aleatorias HttpOnly SameSite=Lax de ocho horas, invalidadas al reiniciar o cerrar sesión. Cinco intentos de login por 15 minutos por dirección local. Cambio de contraseña invalida otras sesiones.
Roles: administrador configura; supervisor puede enviar encargos y aprobar/verificar acciones; lector solo consulta. Todos comparten la información de esta instalación. No hay aislamiento por empresa ni por departamento. Las rutas API requieren sesión, incluidas descargas y exportaciones. La pausa impide iniciar nuevos turnos, revisar correo y aprobar acciones, sin cancelar operaciones externas ya enviadas.
Pendientes: recuperación de contraseña, gestión completa de usuarios, cuotas económicas, migración completa de secretos, restauración integral y aislamiento multiempresa. El primer administrador se crea localmente: completar esta configuración antes de dar acceso al equipo. No desplegar públicamente.
