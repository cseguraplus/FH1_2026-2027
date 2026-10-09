# API actual y contrato propuesto

## API observada en la versión 8
Las rutas actuales utilizan cookies de sesión; la aplicación verifica la identidad y decide el user_id. Nunca debe aceptar un user_id arbitrario del navegador.

| Ruta | Entrada y comportamiento | Errores relevantes |
| --- | --- | --- |
| GET /api/auth | configured, email propia y posible vínculo con perfil anterior. Sin sesión, no identifica perfiles de terceros. | 503 si falla proveedor |
| POST /api/auth | signup, signin, recover, password, signout, link; esquemas estrictos por acción | 400, 401, 403, 409, 413, 415, 429, 503 |
| GET /auth/callback | code PKCE y next interno; intercambia código por sesión y redirige | 303 a acceso si enlace inválido |
| GET /api/state | Perfil propio, progreso, patrocinador, descendientes hasta profundidad 3; postulaciones solo administrador | 401, 429, 503 |
| POST /api/actions | register, completeLesson, approveFounder | 400, 401, 403, 409, 413, 415, 429, 503 |

### Cuerpos actuales
- register: action, name (2–70), city (máx. 70), sponsorCode (máx. 24), consent: true, wantsFounder: boolean.
- completeLesson: action, lessonId (máx. 40), answer entero de 0 a 2. El servidor valida la respuesta.
- approveFounder: action, publicId UUID. Requiere administrador y postulante elegible; máximo 10.
- signup: action, email, password (12–128), next opcional (máx. 800).
- signin: action, email, password (1–128), next opcional.
- recover: action, email. Mensaje genérico.
- password: action, password (12–128), sesión válida.
- signout y link: únicamente action. Vincular exige ambas identidades verificadas.

POST exige Origin igual al origen de la solicitud. JSON máximo 5,000 bytes, incluyendo lectura por streaming. La respuesta usa no-store y campos explícitos. No asumir que esta política CSP se aplica al HTML de todo el sitio.

Límites actuales: lectura 120/min por cuenta, escritura 30/min, registro 5/15 min, autenticación 12/15 min por email y 40/15 min por IP cuando el proxy la proporciona; límite global Auth 200/15 min. Son límites de la aplicación, no los del correo o Supabase. El crecimiento puede requerir ajustarlos tras medir.

## API propuesta
openapi-propuesta.json define un subconjunto inicial para perfil, red, cursos, reproducción, progreso, órdenes y vista previa de cierres. Ninguna ruta /api/v1 está implementada.

Convenciones propuestas:
- Identificadores públicos UUID; tiempos RFC3339 UTC; dinero entero en centavos con currency=MXN.
- Paginación por cursor opaco firmado o validado, limit por defecto 25 y máximo 100; no permitir un tamaño ilimitado.
- Errores con code, message y request_id sin datos internos.
- Sesión por cookie HttpOnly; cambios requieren Origin permitido y protección CSRF equivalente al contrato actual.
- Idempotency-Key obligatoria en creación de orden y cierre; almacenar scope, actor, hash de solicitud y respuesta. Misma clave con otro cuerpo debe dar 409.
- Un evento de progreso lleva event_id para eliminar duplicados. No autoriza fijar aprobación, porcentaje visto ni otro alumno.
- Autorizar tanto recurso como acción. Validar relación entre lessonId, versión y matrícula.
- No devolver tokens de sesión en JSON; el permiso temporal de reproducción es independiente y no concede acceso a la API.

## Pagos y callbacks externos
El adaptador de pasarela será definido después de D09. Cada webhook tiene cuerpo crudo acotado, firma y verificación de tiempo según proveedor; no usa la regla Origin del navegador. Validar importe, moneda, referencia y estado consultado al proveedor cuando haga falta. Registrar evento único antes de aplicar cambios en una transacción. Responder éxito tras persistencia segura; procesar con reintentos y cola de fallos.

Un redirect de “pago exitoso” no es evidencia suficiente de cobro. No guardar datos de tarjeta. Integrar checkout alojado o tokenización del proveedor elegido.

## Acciones administrativas adicionales a diseñar
Publicar curso; moderar comentario; aprobar fundador; configurar periodo; simular, aprobar y ejecutar cierre; preparar, aprobar y enviar lote de liquidación; revertir asiento. Cada permiso es independiente y requiere auditoría. La vista previa de cierre nunca mueve dinero.
