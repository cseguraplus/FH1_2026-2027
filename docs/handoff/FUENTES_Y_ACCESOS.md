# Fuentes accesos y reproducción del estado actual

## Identificadores no secretos
- Sitio: https://fhealth.mx
- Proyecto Sites: appgprj_6ac01c8b7cb48191839d6099497b8cd4
- Versión guardada: appgprj_6ac01c8b7cb48191839d6099497b8cd4~appgver_0fb16aa776e08191835da39d67653041
- Commit: da8caaa6785c83fc78deb6ef0cbed20d1e567783
- Despliegue de referencia: appgdep_6ac6af19377c819189baf9ecca4610f8
- Checkout inspeccionado: /workspace/sites/fhealth-fundadores-mx
- No hay remoto Git configurado en este checkout. La versión guardada en Sites y la instantánea entregada son la referencia para iniciar el repositorio del equipo.
- D1 binding: DB; R2 no configurado en hosting.json.
- Supabase: F Health México, jcerwunworwjrtpyqyoc, ca-central-1; Postgres 17.11.0.003.
- Supabase URL: https://jcerwunworwjrtpyqyoc.supabase.co
- Dominio registrado en Namecheap; DNS actual se debe verificar antes de modificarlo.
- SMTP de acceso: Resend, remitente acceso@fhealth.mx. No se incluyen secretos ni credenciales.

## Accesos a coordinar
| Servicio | Responsable propuesto | Claudio necesita | Condición |
| --- | --- | --- | --- |
| Repositorio | Carlos propietario | Cuenta individual de desarrollo | Crear/asignar repo y proteger rama principal |
| Sites o hosting futuro | Carlos propietario | Deploy staging y producción según acuerdo | Usar CI, revisión y reversión |
| Supabase | Carlos propietario | Proyecto de staging y mínimo acceso productivo | MFA y cuentas individuales; revisar capacidades del plan |
| D1 export | Carlos y Claudio | Lectura/export durante corte | Acceso autorizado mediante hosting |
| Resend | Carlos propietario | Configuración y pruebas de correo | Token acotado guardado en gestor de secretos |
| Video | Por contratar | Upload, webhook y firma en staging | Presupuesto y permisos de contenido |
| Pasarela | Por seleccionar | Sandbox, webhooks y conciliación | Modelo aceptado por el proveedor |
| Namecheap | Carlos propietario | Cambios DNS coordinados | No compartir contraseña; no tocar correo MX sin necesidad |
| Notion | Carlos propietario | Lectura y edición de documentación acordada | Invitar después de verificar el correo de Claudio |

No se ha invitado a Claudio ni concedido permisos. Su correo no está confirmado en esta entrega.

## Puesta en marcha del código
La instantánea incluye package.json, package-lock.json y scripts del proyecto. Node >=22.13.0 es el mínimo declarado; las pruebas usan node:sqlite y requieren una versión que lo soporte. Utilizar la versión validada del equipo y el lockfile.

En una copia aislada: revisar README y PROJECT.md, ejecutar npm run install:ci, configurar únicamente credenciales de staging, ejecutar npm run dev y luego npm run build. El perfil portable tiene simulación local de identidad; no convertir esa simulación en autenticación de producción.

Pruebas ejecutadas el 2026-10-07:
```sh
node --test scripts/security.test.mjs scripts/commissions.test.mjs
```
Resultado: 40 pruebas, 40 aprobadas. Alcance: handlers reales con SQLite aislado y simulaciones de la frontera de identidad y transporte D1. No valida SMTP, callback real entre navegadores, hosting, pasarela ni capacidad de 500 usuarios.

Variables de runtime conocidas: FH_AUTH_MODE=email, SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY. Aunque una publishable key no es una clave administrativa, no sustituye RLS ni permisos de API. Valores sensibles y SMTP se transfieren por gestor de secretos o configuración del proveedor. No usar service_role en cliente.

## Archivos importantes
- app/workspace.tsx: vistas principales, registro, organización y lanzamiento.
- app/product-overview.tsx: comunicación comercial FH1.
- lib/academy.ts: las seis lecciones actuales.
- app/acceso/access-form.tsx y lib/email-auth.ts: interfaz y sesión email.
- app/api/auth/route.ts y app/auth/callback/route.ts: flujos Auth.
- lib/account-link.ts y lib/admin.ts: vínculo de identidad y administración.
- app/api/actions/route.ts y app/api/state/route.ts: escritura y proyección de datos.
- db/schema.ts y drizzle/*.sql: esquema D1.
- lib/rate-limit.ts y lib/request-body.ts: límites persistentes y tamaño de solicitudes.
- scripts/security.test.mjs y scripts/commissions.test.mjs: regresiones existentes.

## Marca y recursos
Conservar los originales del repositorio: public/brand/fh1.png, fh-logo-pine.svg, fh-logo-tea.svg, fh-logo-blue.svg, fh-symbol.svg, fh-pattern.jpg y tipografías AtkinsonHyperlegible Regular/Bold.
Paleta vigente: verde #074735, té #CDECB4, fondo #F2F2ED, azul #0C2F50, azul medio #6EA0C6, azul claro #C4E3FF.
No se incluye ninguna marca de proveedor en la comunicación que debe implementar Claudio.

## Fuentes internas y criterio de precedencia
1. Confirmaciones de Carlos en esta conversación y reglas comerciales actualizadas.
2. Estado técnico del commit y consultas de servicios de este corte.
3. Propuestas documentadas, sin confundirlas con aprobaciones.
Los documentos históricos pueden contener porcentajes, precios, fechas o arquitectura anteriores.

Notion:
- Centro del proyecto: https://app.notion.com/p/3ed205e3987e81a1a5b3c4b921f1096b
- Reglas comerciales: https://app.notion.com/p/3f1205e3987e81508703e03960eb9e11
- Plataforma: https://app.notion.com/p/3ed205e3987e8164bcabd52a7347c9e1
- Escuelas: https://app.notion.com/p/3ed205e3987e8186bab0f54501399839
- Entrega Claudio: https://app.notion.com/p/3f2205e3987e81cda5f0c054eaa83608

## Referencias técnicas oficiales
Consultadas el 2026-10-07. Verificar nuevamente versiones y costos al implementar.
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase sesión SSR: https://supabase.com/docs/guides/auth/server-side/advanced-guide
- Supabase respaldos: https://supabase.com/docs/guides/platform/backups
- Supabase cambios: https://supabase.com/changelog
- Cloudflare D1 export: https://developers.cloudflare.com/d1/best-practices/import-export-data/
- Cloudflare Stream privado: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/

Las decisiones arquitectónicas y objetivos de capacidad de este paquete son propuestas para F Health, no certificaciones del proveedor. El estado y las cuotas del plan deben revisarse antes de contratar.
