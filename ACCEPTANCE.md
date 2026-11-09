# Casos de aceptación — definidos antes de implementar

1. Oficina con marca Pulpo, dos puestos, silla y agente detrás del escritorio, sprites originales y navegación accesible.
2. Doble clic, teclado y Hablar abren Chat/Tareas/Configuración. Chats persisten y reanudan el ID exacto de Codex.
3. Crear/editar agente genera carpeta estable e instrucciones; editar conserva el bloque DOE y preferencias del usuario. Existe un único respaldo.
4. Esfuerzo low/medium/high persiste y se aplica en el siguiente turno, siempre gpt-6-luna. Cola serial por agente.
5. Solicitudes persistentes levantan mano, incluso trabajando. Abrir/refrescar no resuelve; dos pendientes requieren dos resoluciones. También Pulpo.
6. Revisión Gmail en backend: intervalo persistente, recibidos/enviados, cursor, pausa/reanudar/revisar ahora, sin solapamiento ni duplicación; fallos no avanzan cursor.
7. Pulpo clasifica contrato hacia Legal y usa respaldo si no hay especialidad. Guarda fuente y motivo.
8. Puente Composio descubre esquemas; secretos solo backend. Escritura bloqueada hasta aprobación de versión exacta. Rechazar/pedir cambios no ejecuta. Doble clic no duplica y resultado incierto no se reintenta automáticamente.
9. Reiniciar preserva chats, sesiones, tareas, solicitudes y programación. Trabajos interrumpidos quedan explícitos.
10. E2E con proveedores ficticios aislados, capturas e informe. Recorrido real de Codex separado; conexiones ausentes figuran pendientes sin resultados inventados.
