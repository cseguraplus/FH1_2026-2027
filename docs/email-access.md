# FH · Acceso por correo

## Estado

Integración preparada con Supabase Auth. La conexión real está pendiente: no hay
proyecto de autenticación ni correo transaccional configurados en este Site.
La pantalla `/acceso` permite revisar el diseño, con envío deshabilitado mientras
falta la conexión. El acceso vigente se conserva hasta activar el modo `email`.

## Activación

1. Crear o seleccionar un proyecto Supabase bajo control de FH. Activar correo y
   contraseña, **confirmación obligatoria del correo** y contraseña mínima de
   12 caracteres. Configurar protección contra abuso en el proveedor.
2. Configurar SMTP propio para enviar confirmaciones y recuperación a contactos
   externos. El correo de prueba incorporado de Supabase tiene restricciones y
   no sirve como configuración de lanzamiento. Verificar remitente y dominio,
   entrega y límites antes de abrir la captación.
3. Site URL: `https://fhealth.mx`. Autorizar callbacks exactos de ambos dominios:
   `https://fhealth.mx/auth/callback` y
   `https://www.fhealth.mx/auth/callback`, incluidos sus parámetros de retorno
   según el patrón admitido por Supabase. No autorizar dominios ajenos ni usar
   comodines globales. Los enlaces de registro y recuperación utilizan PKCE y
   deben abrirse en el mismo navegador donde se solicitaron.
4. En la configuración de ejecución de Sites guardar `SUPABASE_URL` y
   `SUPABASE_PUBLISHABLE_KEY` del mismo proyecto. Basta una clave publicable;
   **no se requiere ni debe añadirse una clave service_role**. No poner claves
   en Notion ni en el código. Cambiar `FH_AUTH_MODE` a `email` solo cuando estén
   completos los pasos anteriores, y publicar la versión guardada para aplicar
   la configuración.
5. Comprobar con cuentas de prueba consentidas: alta y confirmación, contraseña
   incorrecta, recuperación, cierre de sesión, invitación preservada y acceso
   desde otro dispositivo. Revisar el flujo en los dos dominios.
6. Vincular cada perfil anterior mediante `/acceso?mode=link`: autenticar la
   nueva cuenta de correo y la cuenta anterior, y confirmar la vinculación.
   Comprobar mismo código, organización, progreso y rol. No crear un segundo
   perfil antes de vincular. Nunca asignar perfiles por coincidencia de correo
   o nombre. Si ya existen dos perfiles, revisar el caso explícitamente.

## Diseño

- Las credenciales las gestiona Supabase Auth; FH sigue guardando perfiles,
  organización y progreso en D1. No se migra ni exporta la base de perfiles.
- El SDK se ejecuta en el servidor por petición; verifica al usuario mediante
  `getUser`. No se confía en `getSession`, un token decodificado sin verificar
  o campos de identidad enviados por el formulario.
- Cookies HttpOnly, Secure en HTTPS, SameSite=Lax, host propio y sin caché.
  Ningún token se devuelve en JSON ni se guarda en localStorage.
- Las rutas POST exigen el mismo origen, limitan el cuerpo y aplican cuotas
  persistentes globales, por IP cuando está disponible y por correo cifrado
  mediante hash en los contadores. Nunca se registran contraseñas o tokens.
- `auth_links` vincula una identidad Supabase con un perfil FH existente sin
  cambiar su identificador. La migración es aditiva y conserva datos anteriores.
- Un correo coincidente con el del propietario **no concede administración**.
  Un perfil previamente administrativo conserva su rol solo al vincularse con
  prueba de ambas identidades.
- La vinculación genera auditoría y rechaza reasignaciones o perfiles duplicados.
  Las recuperaciones responden sin revelar si un correo está registrado.
- El cierre de sesión borra cookies de acceso. El cambio de contraseña solicita
  cierre global en Supabase; la invalidez de JWT ya emitidos depende además de
  su expiración. Verificar duración y revocación con la configuración elegida.
- La baja y reentrada comercial por periodos sin compra son reglas distintas de
  la migración de autenticación y no están implementadas por este cambio.

## Verificación y límites

Las pruebas locales ejercitan las rutas reales y una base SQLite aislada. El
servicio Supabase se sustituye por un doble de prueba; no demuestran entrega de
correo, OAuth/PKCE real, propagación de cookies de la plataforma ni la migración
efectiva de los perfiles existentes. Esas comprobaciones requieren la conexión.

Fuentes: https://supabase.com/docs/guides/auth/server-side/creating-a-client,
https://supabase.com/docs/guides/auth/passwords,
https://supabase.com/docs/guides/auth/auth-smtp.
