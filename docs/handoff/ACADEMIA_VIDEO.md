# Academia audiovisual F Health

## Decisión y alcance
Confirmado por Carlos el 2026-10-07: temas en video tipo Skool. La implementación detallada que sigue es una propuesta para Claudio, con identidad propia FH y sin obligación de contratar Skool.

## Pantallas
1. Inicio: continuar lección, catálogo por rutas, progreso y avisos académicos.
2. Curso: portada, descripción, instructor, módulos, duración, acceso y versión.
3. Lección: reproductor, índice, transcripción, recursos, evaluación opcional y comentarios.
4. Comunidad: temas, publicaciones, respuestas, búsqueda, reportes y avisos fijados.
5. Calendario: zona horaria visible, sesión en vivo, enlace autorizado y grabación posterior.
6. Administración: carga, transcodificación, revisión, publicación, orden, permisos, moderación y analítica.

Las pantallas 1–3 y administración son la prioridad inicial; comentarios por lección incluidos como propuesta inicial. Comunidad general y calendario se entregan después de validar aprendizaje y operación. Gamificación educativa queda posterior.

## Contenidos que Carlos debe aportar o aprobar
- Responsable académico y editores por ruta.
- Inventario de cursos: objetivo, público, módulos, lecciones, duración, instructor y versiones.
- Grabaciones originales, derechos de uso de imagen y materiales.
- Portadas FH, subtítulos revisados, transcripción y documentos de apoyo.
- Evaluaciones, respuestas y criterio de aprobación.
- Visibilidad y acceso de invitados, clientes, distribuidores e inactivos.
- Política de convivencia, moderación y canal de reportes.

No hay videos entregados ni permisos de Enrique confirmados en este corte. Las seis lecciones vigentes sirven como guion inicial, sujetas a revisión editorial. Mantener el identificador original para preservar avances.

## Flujo de publicación
Borrador → en revisión → aprobado → publicado → archivado. Los videos siguen un estado separado: pendiente de carga → procesando → listo o error. El servidor permite publicar solo si la versión editorial aprobada tiene un recurso listo y permisos definidos. Archivar conserva historial y ofrece un sustituto si existe.

## Acceso y privacidad
Autorizar matrícula y audiencia en el servidor antes de emitir reproducción. Roles propuestos: alumno, instructor, editor y moderador; solo propietario o rol explícito administra permisos. Un instructor no obtiene datos bancarios, toda la red ni las claves del proveedor.

Los comentarios y comunidad muestran un nombre visible y avatar opcional, no correo ni domicilio. El alumno debe entender quién ve su participación. Permitir reportar y moderar; registrar motivo y autor de acciones. Sanitizar HTML o trabajar con texto/Markdown limitado. Los archivos descargables privados requieren autorización y enlaces de corta duración.

## Video
Usar proveedor especializado para subida y reproducción adaptativa. Stream es candidato, no compra aprobada. Su configuración pública por defecto debe cambiarse a acceso firmado si el curso es privado. TTL propuesto 10 minutos con renovación autorizada; ajustar a duración, buffering y soporte del proveedor en pruebas.

Separar autorización de subir de autorización de reproducir. Las claves de firma solo en backend. Los webhooks se validan según contrato del proveedor; procesar duplicados y orden invertido sin publicar versiones equivocadas. Validar límites de tamaño, tipo y duración; la subida no atraviesa el límite JSON de 5 KB.

## Progreso
Guardar última posición y cobertura de intervalos vistos por alumno y lesson_version. Eventos cada 15–30 segundos como propuesta, más pausa y salida; reintentar con event_id único. Rechazar duraciones imposibles y exceso de frecuencia. Combinar intervalos solapados; usar máximo avance confirmado para evitar retroceso por eventos retrasados. El porcentaje reportado por el navegador no acredita por sí solo aprendizaje.

Finalización configurable: confirmación explícita, cobertura mínima o evaluación; Carlos define la regla de cada curso. Una nota de evaluación válida se calcula en servidor. No condicionar comisiones a un curso sin acuerdo comercial expreso.

## Carga y presupuesto
Escenario de planeación, no demanda comprobada: 500 alumnos x 120 minutos al mes = 60,000 minutos de reproducción. Catálogo hipotético de 40 lecciones x 12 minutos = 480 minutos almacenados. Cotizar precios vigentes, cuotas y sobreconsumo con el proveedor antes de contratar. La reproducción va por CDN; separar pruebas de reproducción de las de escritura de progreso.

## Aceptación adicional
- Dos alumnos no pueden leer o cambiar el progreso del otro.
- La revocación de acceso impide emitir tokens nuevos; documentar la vigencia de tokens ya emitidos.
- Cambiar video crea una nueva versión; no modifica retroactivamente una aprobación.
- Subtítulos y controles accesibles, reanudación en móvil, red lenta y fallback de transcripción.
- Eliminación o archivo de un comentario no rompe el hilo; auditoría moderada solo visible por rol.
