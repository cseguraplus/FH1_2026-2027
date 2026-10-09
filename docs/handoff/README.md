# Entrega de desarrollo F Health para Claudio

Corte: 2026-10-07. Meta inicial: 310 a 500 integrantes. Leer primero ESPECIFICACION_MAESTRA.md.
Centro de acuerdos: https://app.notion.com/p/3f2205e3987e81cda5f0c054eaa83608

## Contenido
- ESPECIFICACION_MAESTRA.md: documento maestro también entregado en Word.
- API_ACTUAL_Y_PROPUESTA.md y openapi-propuesta.json: inventario real y contrato inicial propuesto; las rutas /api/v1 no existen todavía.
- DATOS_Y_MIGRACION.md y diccionario-datos.json: destino propuesto y conservación del origen.
- ACADEMIA_VIDEO.md: pantallas, contenidos, video y permisos.
- FUENTES_Y_ACCESOS.md: ubicaciones, servicios, puesta en marcha y responsabilidades.
- backlog.json y pruebas-aceptacion.json: tareas y escenarios pendientes, con dependencias.
- validacion/validate_export.py: inspección local de un export normalizado de D1.
- validacion/test_validator.py y fixture.json: pruebas con datos ficticios.
- manifest.json: integridad de los archivos del paquete.

## Tres entregas distintas
La instantánea FH_Codigo_Sitio_v8.zip se entrega por separado y contiene el código del commit da8caaa6785c83fc78deb6ef0cbed20d1e567783. Este paquete no incluye bases reales, contraseñas, tokens, claves de pasarela ni material privado de alumnos. Los servicios y accesos deben habilitarse de forma individual.

## Arranque recomendado
1. Claudio revisa el documento y las decisiones D01 a D10.
2. Carlos y Claudio establecen repositorio del equipo y cuentas individuales.
3. Claudio reproduce el código actual en entorno aislado y entrega diseño final y estimación.
4. Se ensaya migración y Academia antes de habilitar comercio.
5. Se implementa y prueba el motor solo con reglas versionadas y casos comerciales aprobados.

Las especificaciones son implementables como punto de partida, pero no equivalen a módulos construidos ni a una autorización para migrar producción.
