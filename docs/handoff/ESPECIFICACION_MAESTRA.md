# F Health entrega de desarrollo para Claudio

7 de octubre de 2026 · Versión 1

## Encargo y alcance

Claudio desarrollará la siguiente etapa de la plataforma propia de F Health. El objetivo es conservar los registros y la organización del prelanzamiento, incorporar la operación comercial y convertir Academia en un espacio de aprendizaje en video tipo Skool. Carlos define las reglas y prioridades; Claudio propone el diseño final, la estimación y el plan de ejecución.

La cohorte de 310 a 500 integrantes es la capacidad inicial que se debe diseñar y verificar. No representa el número de cuentas existentes: la consulta de este corte encontró 2 perfiles en D1, 1 fundador y 1 cuenta de Supabase Auth con correo confirmado. Los conteos deberán repetirse al migrar.

Esta entrega distingue tres estados: confirmado por Carlos, observado en el sistema y propuesta técnica. Una propuesta no autoriza un cobro, una retención, una baja ni un cambio de patrocinador. La implementación financiera deberá esperar las decisiones que afectan su resultado.

| Entrega | Uso |
| --- | --- |
| Documento maestro | Alcance, reglas, Academia, arquitectura, migración y aceptación. |
| Paquete técnico | Especificaciones, contratos API propuestos, diccionario, backlog, casos de prueba y validador local. |
| Código del sitio versión 8 | Instantánea del código y recursos actuales. Requiere configurar servicios y secretos por separado. |
| Registro en Notion | Centro de acuerdos y seguimiento del desarrollo para Carlos y Claudio. |

- Prioridad inicial: continuidad del acceso y de la red, privacidad de datos y Academia en video.
- Operación comercial: catálogo, pedidos, pagos conciliados, periodos, elegibilidad, comisiones y liquidación.
- Crecimiento: medir carga real, incorporar observabilidad y escalar por evidencia. No se presupone que 500 miembros sean 500 usuarios simultáneos.
- Fuera de esta primera definición: aplicaciones nativas, expansión internacional, cobros automáticos y gamificación que altere comisiones.




## Estado técnico comprobado

El sitio público está en https://fhealth.mx. La versión 8 conserva la identidad FH y el acceso propio por correo. Supabase administra las credenciales; Cloudflare D1, a través de Sites, conserva los datos operativos. El esquema public de Supabase se encontró sin tablas en esta revisión.

El código actual usa React 19, TypeScript, vinext sobre Cloudflare Workers, Drizzle y SQLite D1. No debe tratarse como un despliegue Next.js convencional sin revisar los adaptadores de Sites. El archivo package-lock.json fija las dependencias.

| Componente | Estado actual |
| --- | --- |
| Acceso | Alta, confirmación, inicio, recuperación, cierre y vinculación de acceso anterior. |
| Registro y red | Perfil, ciudad, código de invitación, patrocinador y descendientes visibles hasta tres niveles. |
| Fundadores | Postulación y aprobación administrativa; máximo implementado de 10. |
| Academia | Seis lecciones de texto con pregunta y progreso guardado; sin plataforma audiovisual. |
| Comisiones | Calculadora 36/9/5. No hay libro contable ni liquidación real. |
| Comercio | No están implementados pedidos, cobros, inventario, envíos ni devoluciones. |
| Reglas mensuales | No están implementadas elegibilidad, compresión, baja comercial ni reingreso. |

- Commit de referencia: da8caaa6785c83fc78deb6ef0cbed20d1e567783. Árbol de trabajo limpio al inspeccionarlo.
- 40 pruebas locales aprobadas en este corte. Simulan identidad y transporte D1; no prueban correo real, pagos ni carga de producción.
- Desviación concreta: Inicio, Lanzamiento y la lección finanzas aún muestran una ventana del día 1 al 3. Corregir a cinco días con fechas por confirmar.
- El panel consulta red y postulaciones sin paginación. Incorporar consultas acotadas antes de ampliar la convocatoria.




## Reglas comerciales confirmadas

El software debe representar estas reglas mediante una versión comercial identificable. Cada pedido, cierre y movimiento debe conservar la versión aplicada para que una modificación futura no recalcule el pasado sin un ajuste explícito.

| ID | Regla vigente |
| --- | --- |
| RC01 | FH1 cuesta 2,500 MXN por bote, con impuestos y envío nacional incluidos en esta etapa. |
| RC02 | Plan de tres niveles: 36%, 9% y 5%. Sobre 2,500 MXN: 900, 225 y 125 MXN brutos; total máximo 1,250 MXN. |
| RC03 | Compra personal mensual de al menos un bote de FH1 indispensable para acceder a comisiones. |
| RC04 | Ventana de compra de cinco días; fechas y tipo de días todavía por definir. |
| RC05 | Un periodo sin compra habilitante: sin comisiones y compresión de red en ese periodo. |
| RC06 | Dos periodos consecutivos sin compra: baja comercial y compresión de red. |
| RC07 | Una compra habilitante intermedia reinicia el contador de periodos consecutivos sin compra. |
| RC08 | Reingreso desde cero, con una nueva organización y sin recuperar posición ni red anteriores. |
| RC09 | El prerregistro gratuito no cuenta como un periodo incumplido. |
| RC10 | El envío promedio de 180 MXN por DHL o FedEx lo absorbe FH. Registrar el costo real por guía. |

La comisión es un ingreso bruto; no constituye utilidad ni rendimiento garantizado. Los ejemplos del simulador no crean un derecho de cobro. Los impuestos de la venta, retenciones y documentos fiscales requieren configuración validada por el responsable contable.

El monto del envío es un promedio operativo, no una tarifa adicional para el cliente ni un límite contractual del transporte. Los costos de proveedores no deben aparecer en los materiales comerciales.

Producto y presentaciones deben usar únicamente FH1 y F Health. Conservar la imagen FH1 y el precio público. No publicar exclusividad frente a toda la industria, comparativos de Amazon ni beneficios clínicos de la fórmula sin respaldo verificable.


## Decisiones necesarias antes de cobrar

Estas decisiones no impiden desarrollar identidad, Academia, paneles o pruebas con datos ficticios. Sí impiden activar un cálculo o pago comercial definitivo. Cada acuerdo debe registrar responsable, fecha, versión y casos de ejemplo aceptados.

| ID | Carlos debe resolver con el responsable indicado |
| --- | --- |
| D01 | Fechas mensuales, días naturales o hábiles, zona horaria y hora exacta de apertura y cierre. |
| D02 | Qué evento acredita compra; pagos tardíos; ventas previas a la compra personal; periodo inicial de un alta. |
| D03 | Compresión temporal: selección de ascendentes activos, profundidad de búsqueda y niveles sin beneficiario. |
| D04 | Compresión por baja: destino de cada rama, orden y momento del cambio; patrocinador y código al reingresar. |
| D05 | Cancelaciones, devoluciones parciales, contracargos, reversión de elegibilidad y saldos ya pagados. |
| D06 | Base de comisión con descuentos o varios botes, redondeo y ausencia de un beneficiario elegible. |
| D07 | Corte, fecha y mínimo de liquidación; retenciones, validación fiscal y bancaria y autorizadores. |
| D08 | Acceso a Academia para cliente, distribuidor, inactivo y persona dada de baja; cursos obligatorios. |
| D09 | Pasarela compatible con el modelo, entidad vendedora, facturación, cobertura y política de entrega. |
| D10 | Moderación académica, uso de imagen, permisos de videos y datos visibles para líderes. |

Las propuestas históricas de pagos semanales, mínimo de 100 MXN, espera de siete días hábiles y reservas de inventario de 30 minutos no se consideran ratificadas. No deben convertirse en valores por defecto de producción.

La zona America/Mexico_City es una propuesta operativa para este lanzamiento. Guardar marcas de tiempo en UTC y mostrar el horario local. La ventana se representará con apertura inclusiva y cierre exclusivo, una vez ratificados ambos instantes.

La separación entre cliente y distribuidor es una propuesta de diseño. El registro actual solo tiene la intención de ser fundador; no dispone de esa clasificación comercial.


## Recorridos y módulos de la aplicación

Separar los estados de cuenta, ciclo comercial, pedido, pago, entrega y capacitación. Una cuenta autenticada puede existir sin perfil; una compra iniciada puede estar sin pagar; una comisión calculada puede estar retenida; un alumno puede seguir estudiando aunque su ciclo comercial esté inactivo si así se aprueba.

El checkout nunca debe aceptar del navegador el precio definitivo, el patrocinador del beneficiario, el porcentaje ni el importe de una comisión. El servidor consulta el catálogo y crea una orden identificable; el evento verificado de la pasarela cambia su estado.

El panel comercial mostrará importe bruto, ajustes, retenciones y neto liquidado de forma separada. Cada importe debe poder rastrearse hasta pedido, unidad, periodo, beneficiario, versión de reglas y movimiento.

| Persona | Recorrido y resultado esperado |
| --- | --- |
| Nuevo integrante | Abre enlace de invitación, crea cuenta, confirma correo, revisa patrocinador y acepta versiones de documentos. |
| Integrante anterior | Verifica acceso anterior y nuevo; conserva perfil, código, red y avance. Un conflicto se revisa sin fusionar por nombre. |
| Alumno | Entra a Academia, elige una ruta, continúa un video, consulta materiales y registra su avance. |
| Comprador | Consulta FH1, dirección, total y términos; paga con la pasarela; recibe estado real de pedido y envío. |
| Distribuidor | Ve compra personal, estado del periodo, red autorizada y comisiones con estados y explicaciones. |
| Finanzas | Concilia pagos y devoluciones, revisa el cierre y prepara una liquidación con doble autorización. |
| Administrador | Publica contenidos, atiende incidencias y gestiona permisos según su función. |

- Administración mínima propuesta: soporte, contenidos, finanzas, aprobador de pagos y propietario.
- Ser fundador es una distinción comercial; no otorga permisos de administración.
- Usar estados vacíos, recuperación de errores, confirmación de acciones críticas y navegación accesible en móvil.
- Conservar los enlaces existentes con parámetro ref durante el cambio de plataforma.




## Academia con cursos en video

Requisito confirmado por Carlos el 7 de octubre: Academia debe organizar temas en video con una experiencia de aprendizaje tipo Skool. Se propone construirla dentro de F Health, con acceso propio por correo e identidad FH. La referencia es de experiencia; no implica contratar Skool ni reproducir su marca.

La pantalla inicial mostrará Continuar aprendiendo, catálogo por ruta y novedades. Cada curso tendrá portada, descripción, responsable, nivel, módulos y progreso. La lección reunirá reproductor, índice lateral, recursos, transcripción, comentarios y acceso a la siguiente clase.

| Prioridad | Capacidad propuesta |
| --- | --- |
| Inicial | Cursos, módulos y lecciones ordenables; borrador, revisión y publicación. |
| Inicial | Video adaptable a móvil, subtítulos, control de velocidad y reanudación. |
| Inicial | Progreso por alumno y versión de lección; evaluación opcional separada del video. |
| Inicial | Archivos descargables autorizados y comentarios moderados por lección. |
| Siguiente | Comunidad por temas con publicaciones, respuestas, reportes y avisos fijados. |
| Siguiente | Calendario de sesiones en vivo, enlaces de acceso y grabaciones. |
| Posterior | Reconocimientos y gamificación educativa, sin alterar comisiones. |

Rutas iniciales propuestas: salud funcional y FH1, marketing y ventas, liderazgo y acompañamiento, negocios y finanzas. El temario y sus responsables editoriales se aprobarán antes de publicar. No se presupone que las grabaciones ya existan.

Las seis lecciones actuales se conservarán como introducción de legado. Un progreso anterior no acredita haber visto un video nuevo. La pantalla deberá distinguir entre avance histórico y la nueva versión audiovisual.

Enrique puede participar como instructor si Carlos lo acuerda con él. No se le ha asignado un rol, solicitado material ni enviado una invitación.


## Academia técnica y aceptación

Separar metadatos educativos de los archivos de video. La aplicación administrará cursos, permisos, comentarios y progreso en Postgres. Un servicio de video manejará carga, transcodificación y reproducción adaptativa. Cloudflare Stream es una opción técnica evaluable; proveedor y presupuesto aún deben aprobarse.

El backend comprobará sesión, publicación del curso y permiso de acceso antes de emitir una autorización de reproducción de corta duración. Configurar los videos como privados en el proveedor; ocultar un enlace no constituye control de acceso. Las URLs firmadas reducen el uso no autorizado, pero no impiden grabar la pantalla.

| Prueba | Criterio de aceptación |
| --- | --- |
| Acceso | Un alumno sin permiso no obtiene autorización; un token vencido falla. |
| Continuidad | La clase se reanuda después de volver a entrar, sin reducir avance ya guardado. |
| Integridad | Cambiar el alumno o la lección en una solicitud no permite escribir progreso ajeno. |
| Contenido | Solo la versión publicada se presenta a alumnos; se conserva evidencia histórica. |
| Experiencia | Reproductor y subtítulos operan en móvil y teclado; una falla ofrece reintento comprensible. |

- Carga: editor solicita sesión de subida, el navegador transfiere directamente al proveedor y un webhook firmado informa si terminó el procesamiento.
- Publicación: no mostrar una lección como disponible mientras su video siga procesándose o tenga un error. Añadir portada, duración, subtítulos y revisión editorial.
- Progreso: conservar posición y eventos acotados; combinar intervalos vistos sin contar dos veces los solapamientos. Saltar al final no debe otorgar aprobación.
- La regla de finalización del video y la nota mínima se configuran por versión. Ver video, responder evaluación y aprobar curso son estados distintos.
- Comentarios: sanitizar texto, limitar frecuencia, permitir reportar y moderar; no exponer correos ni documentos de alumnos.
- Medir minutos almacenados y reproducidos, errores de carga y fallos del reproductor. El video se distribuye por CDN, no a través de cada respuesta del servidor FH.




## Arquitectura y modelo de datos

Propuesta técnica: conservar Supabase Auth y migrar gradualmente los datos operativos a Postgres dentro del proyecto de F Health. Una aplicación modular, con API, tareas de fondo y un registro transaccional de eventos pendientes, es suficiente como punto de partida. No hace falta dividirla de inicio en muchos servicios.

La base de datos será la fuente de verdad para órdenes y movimientos financieros. La tarea de fondo procesará eventos con reintentos y claves idempotentes. Una transacción debe guardar tanto el cambio de negocio como el evento pendiente de enviar; una caída no debe dejar uno sin el otro.

| Dominio | Entidades propuestas |
| --- | --- |
| Identidad | members, identity_links, staff_roles, consents. |
| Organización | commercial_cycles, sponsorship_edges, periods, eligibility_results. |
| Comercio | products, product_versions, orders, order_items, payments, refunds, shipments, inventory_movements. |
| Comisiones | commission_runs, allocations, ledger_entries, payout_batches, payout_items. |
| Academia | courses, course_versions, modules, lessons, lesson_versions, video_assets, enrollments, progress_events, assessments. |
| Comunidad | posts, comments, reports, moderation_actions, events. |
| Operación | audit_events, outbox_events, idempotency_keys, migration_map. |

Los importes se almacenan como enteros en centavos MXN; las tasas como puntos base: 3600, 900 y 500. Guardar moneda y versión de precio. Cada clave externa de proveedor debe tener una restricción de unicidad dentro de su proveedor.

Una persona puede tener varios ciclos comerciales históricos, pero como máximo un ciclo vigente. El patrocinio original y el operativo deben conservar su intervalo de validez. Prohibir autoasignaciones y ciclos en el grafo, incluso ante cambios concurrentes.

Crear índices por patrocinador, miembro y periodo, estado y fecha, además de claves únicas de evento. Paginación por cursor y consultas agregadas en servidor evitarán descargar toda la organización.


## Motor de periodos y comisiones

El cierre debe ser reproducible: utiliza pagos conciliados, versión de reglas, ventana aprobada y una fotografía de elegibilidad y patrocinio. Ejecutarlo de nuevo con la misma entrada no puede duplicar ausencias, comisiones ni bajas.

Propuesta de compresión temporal para ratificar: desde el comprador, ascender por la organización y seleccionar hasta tres ascendentes elegibles; asignarles 36%, 9% y 5%. Esto puede atravesar más de tres vínculos originales. El límite de tres niveles del panel actual no sirve como límite de búsqueda del motor.

Ejemplo únicamente para validar D03: en Comprador → A inactivo → B activo → C activo → D activo, la propuesta asigna 900 a B, 225 a C y 125 a D. Conservar el patrocinio original durante la compresión temporal. Si falta un beneficiario, su tratamiento debe resolverse antes de cerrar.

- Separar eligibility_status de payout_status: la ausencia de una CLABE validada puede retener un pago sin convertir por sí sola al distribuidor en inactivo.
- Guardar comisión por unidad o asignación identificable; constraint único por orden, unidad, periodo, beneficiario, nivel y versión.
- Los ajustes se registran con asientos de reversión vinculados al original. No sobrescribir el histórico ni borrar un saldo para corregirlo.
- Actualizar el contador de ausencias una sola vez por miembro y periodo comercial cerrado. Excluir prerregistro y tratar el primer periodo según D02.
- Dos ausencias consecutivas terminan el ciclo comercial. Mantener acceso e historial necesarios; abrir un nuevo ciclo al reingreso aprobado.
- La compresión permanente debe guardar relaciones antes y después y motivo. La distribución de descendientes está pendiente de D04.

Prueba numérica mínima: una unidad de 250,000 centavos produce 90,000, 22,500 y 12,500 centavos para tres beneficiarios elegibles. Total 125,000. Para descuentos, devoluciones y redondeo se requieren ejemplos comerciales específicos.

No se ha construido este motor en la versión 8. El archivo lib/commissions.ts contiene una calculadora ilustrativa, no un servicio de liquidación.


## Migración sin perder la organización

Conservar el proyecto Auth actual permite mantener las identidades verificadas. No es necesario trasladar contraseñas para mover los perfiles a Postgres. Si Claudio elige otro proveedor o proyecto, deberá elaborar y probar un plan independiente de migración de autenticación.

En D1, profiles.user_id puede ser una identidad anterior de Sites o un identificador fh-email seguido del UUID de Auth. auth_links relaciona un UUID verificado con un perfil anterior. El public_id y el referral_code deben conservarse. No deduplicar perfiles por nombre ni por coincidencia de correo.

- 1. Inventariar esquema, conteos, códigos, aristas, avances, consentimientos y vínculos. Generar respaldo cifrado y manifiesto de archivos con SHA-256.
- 2. Ensayar en staging aislado. Obtener un corte consistente del origen; si el proveedor no permite snapshot, suspender brevemente las escrituras mientras se exporta.
- 3. Validar unicidad, referencias, fechas, UUID, vínculos uno a uno y ausencia de ciclos. Poner conflictos en cuarentena sin inventar un patrocinador.
- 4. Importar miembros e identidades; después aristas, avances, consentimientos y auditoría. No otorgar roles administrativos por coincidencia de email.
- 5. Conciliar origen y destino por conteos y por fila normalizada. Probar invitación, recuperación, acceso anterior, árbol y progreso con cuentas de ensayo.
- 6. Congelar escrituras, repetir el delta final, verificar y activar un solo destino escritor. Conservar las URLs de invitación y los callbacks aprobados.
- 7. Vigilar errores y conciliación. Si ya hay operaciones nuevas, reconciliarlas antes de revertir; restaurar un respaldo antiguo sin más perdería esas operaciones.

El paquete incluye un validador local de exportación con datos ficticios. No exporta producción, no transforma contraseñas, no escribe bases y no sustituye una conciliación de destino.

request_limits es información efímera y puede reiniciarse en el corte. site_admin debe convertirse en una asignación explícita de rol con auditoría. La baja comercial no debe eliminar cuentas Auth, pedidos ni movimientos históricos.


## Seguridad pruebas y operación

El sistema debe autorizar cada consulta y cada escritura en el servidor. Aplicar permisos por fila en las tablas expuestas de Supabase y limitar los grants. Mantener datos financieros sensibles y tareas administrativas fuera de la API pública. Una clave privilegiada nunca debe llegar al navegador, al repositorio ni a Notion.

El usuario consulta su propia información y una proyección mínima de la red autorizada. Los líderes no necesitan ver correos, documentos fiscales ni cuentas bancarias de sus descendientes. El rol de fundador no es un permiso de lectura global.

| Control | Evidencia exigida |
| --- | --- |
| Identidad | Alta, correo, recuperación, cierre y vinculación probados con dos cuentas independientes. |
| Aislamiento | Pruebas contra IDs ajenos, ramas ajenas y roles insuficientes; respuesta sin datos filtrados. |
| Pagos | Firma, importe y moneda verificados; eventos repetidos y fuera de orden no duplican órdenes ni asientos. |
| Administración | MFA, mínimo privilegio, auditoría y doble autorización de liquidaciones. |
| Recuperación | Respaldo cifrado y restauración ensayada; respaldar también objetos y videos. |
| Academia | Acceso privado, moderación, progreso propio y pruebas de expiración de reproducción. |
| Capacidad | Ensayo con 500 miembros ficticios, árboles profundos y carga concurrente acordada. |

Objetivos técnicos propuestos para presupuestar: 50 sesiones activas en el ensayo, API de lectura p95 menor a 800 ms, errores menores a 1% y cierre de 500 miembros en menos de 5 minutos. Son metas iniciales a validar por Claudio, no mediciones actuales ni garantías.

Propuesta de recuperación: RPO de 15 minutos para operaciones comerciales y RTO de cuatro horas; Claudio debe comprobar disponibilidad y costo del plan que permita cumplirlos. La copia de base de datos no incluye automáticamente los archivos almacenados.

Los registros técnicos deben omitir contraseñas, tokens, documentos y datos bancarios. Mantener IDs de correlación, alertas por webhooks fallidos, cola acumulada, cierres inconsistentes y errores de acceso.


## Plan de trabajo y entrega aceptable

Claudio debe estimar por fase y demostrar el resultado en staging. El paquete incluye backlog priorizado con dependencias y pruebas de aceptación. No se fija una fecha de lanzamiento sin estimación del desarrollador y cierre de decisiones comerciales.

| Fase | Resultado y condición de salida |
| --- | --- |
| A Fundamentos | Repositorio del equipo, entornos separados, reglas versionadas, modelo y seguridad revisados. |
| B Continuidad | Migración ensayada, acceso sin ChatGPT, invitaciones y progreso conservados. |
| C Academia | Curso real de prueba con videos autorizados, subtítulos, avance y comentarios moderados. |
| D Operación | Pedido y pago en sandbox; inventario, envío, devolución y conciliación comprobados. |
| E Red y finanzas | Motor validado con casos aprobados; liquidación con revisión y trazabilidad. |
| F Lanzamiento | Piloto controlado, restauración y carga aceptadas; seguimiento y plan de soporte. |

- Primer entregable de Claudio: arquitectura ratificada, estimación por fase, riesgos, presupuesto operativo y decisiones que bloquean producción.
- Carlos debe disponer de las cuentas propietarias y del repositorio. Claudio recibirá cuentas individuales con permisos acordados; no compartir cuentas ni contraseñas.
- Antes de migrar: firma de conciliación, respaldo probado y procedimiento de reversión revisado por ambos.
- Antes de cobrar: decisiones D01 a D09 resueltas en lo que afecte el lanzamiento; pasarela y textos comerciales aprobados.
- Antes de entregar: código, migraciones, pruebas, manual de administración, monitoreo, soporte y recuperación documentados.

El centro de seguimiento está en Notion: https://app.notion.com/p/3f2205e3987e81cda5f0c054eaa83608. Allí se registrarán acuerdos y evidencia; no datos bancarios ni secretos.

La instantánea de código se entrega por separado del paquete técnico. No hay remoto Git configurado en el checkout inspeccionado. Claudio y Carlos deberán crear o asignar el repositorio del equipo y conservar el commit de origen.

Las fuentes, rutas de código, inventario de servicios y documentación oficial consultada se incluyen en FUENTES_Y_ACCESOS.md. Este paquete prepara la implementación; no ejecuta una migración ni concede accesos.
