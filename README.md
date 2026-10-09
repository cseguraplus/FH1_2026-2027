# F Health · Plataforma

Código del sitio F Health y documentación para continuar el desarrollo con Claudio a partir de la etapa de 310 a 500 integrantes. Esa cifra es una meta de capacidad, no un conteo de registros actuales.

## Punto de partida

- Sitio: https://fhealth.mx
- Origen: versión 8 de Sites, commit `da8caaa6785c83fc78deb6ef0cbed20d1e567783`.
- Esta importación conserva los 153 archivos del origen; el README inicial está en [docs/README-Sites-original.md](docs/README-Sites-original.md).
- Entrega y acuerdos: https://app.notion.com/p/3f2205e3987e81cda5f0c054eaa83608
- Repositorio privado: https://github.com/servivomx-dev/fhealth-platform. El acceso individual de Claudio requiere confirmar su usuario GitHub.

## Qué existe

Vinext y React con Cloudflare D1 para perfiles, red, progreso y controles de acceso. El código incluye acceso por correo con Supabase Auth. La configuración del entorno determina el modo de autenticación; tener Supabase Auth no significa que los datos operativos ya estén migrados a PostgreSQL.

Incluye registro, patrocinio, organización de tres niveles, seis lecciones introductorias, solicitudes de fundador, administración y simulador 36/9/5. El simulador no constituye un saldo ni calcula comisiones devengadas.

Pedidos, pagos, comisiones reales, compresión por periodo y Academia de video están especificados para desarrollo. Las rutas `/api/v1` de la propuesta OpenAPI todavía no están implementadas. `PROJECT.md` conserva descripciones históricas sobre privacidad y acceso; contrastarlas con el código y el documento maestro.

## Inicio local

Requisitos: Node.js >=22.13.0, npm y Git. Las pruebas usan `node:sqlite`; utilizar una versión de Node que lo soporte. Un clon limpio selecciona el perfil portable.

```sh
git clone https://github.com/servivomx-dev/fhealth-platform.git
cd fhealth-platform
npm run install:ci
node --test scripts/security.test.mjs scripts/commissions.test.mjs
npm run dev
```

Para generar el Worker y revisar una compilación local:

```sh
npm run build
npm run start
```

La instalación debe utilizar `package-lock.json`. Consultar [las instrucciones originales](docs/README-Sites-original.md) para aplicar migraciones D1 locales en orden y configurar el perfil del entorno. Los previews se ejecutan sobre datos locales separados.

## Configuración y datos

Consultar `.env.example`; sus valores están vacíos y el modo inicial es `legacy`. Para probar el flujo email, configurar `FH_AUTH_MODE=email`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` con un proyecto de pruebas y sus callbacks. Las claves y el SMTP se configuran en el proveedor o en un gestor de secretos.

La simulación de identidad del perfil portable solo sirve para desarrollo local. Antes de exponer un entorno propio, implementar y verificar su frontera de autenticación: los encabezados confiables del dispatch de Sites no son encabezados que se puedan aceptar de cualquier cliente.

Esta entrega no contiene registros reales ni exportaciones de bases de datos. Los respaldos y la migración se gestionan por separado con las validaciones documentadas. No cargar credenciales, exportaciones de usuarios o archivos de entorno en GitHub.

## Documentación de Claudio

- [Especificación maestra](docs/handoff/ESPECIFICACION_MAESTRA.md)
- [Arquitectura de API actual y propuesta](docs/handoff/API_ACTUAL_Y_PROPUESTA.md)
- [Datos y migración](docs/handoff/DATOS_Y_MIGRACION.md)
- [Academia de video](docs/handoff/ACADEMIA_VIDEO.md)
- [Backlog](docs/handoff/backlog.json) y [pruebas de aceptación](docs/handoff/pruebas-aceptacion.json)
- [Respaldo PDF](docs/handoff/FH_Entrega_Desarrollo_Claudio_v1.pdf) y [Word](docs/handoff/FH_Entrega_Desarrollo_Claudio_v1.docx)

El paquete documental tiene corte del 7 de octubre de 2026; conserva sus propuestas y decisiones abiertas. Las confirmaciones posteriores de Carlos prevalecen. `docs/handoff/manifest.json` valida el paquete original, mientras que `docs/source-import.json` identifica la importación del código.

## Desarrollo y publicación

Trabajar en ramas y revisar cambios antes de integrarlos. Empezar por reproducir el sistema actual y acordar las decisiones abiertas del documento maestro. Ensayar la migración con datos ficticios y mantener un entorno de pruebas separado de producción.

Subir código a este repositorio no despliega automáticamente el sitio ni transfiere la propiedad de Sites, Supabase o Namecheap. Los identificadores de `.openai/hosting.json` proceden del sitio de origen; revisar el destino y sus permisos antes de cualquier publicación.

Las 40 pruebas existentes se aprobaron en la revisión del 7 de octubre de 2026. Cubren handlers, SQLite aislado y fronteras simuladas de identidad/transporte; no certifican SMTP, callbacks reales, pasarela o capacidad de 500 usuarios.

## Variables de entorno

- `FH_OWNER_EMAIL`: correo que puede reclamar el rol de dueño la primera vez. Sin esta variable nadie puede crearlo (cierre seguro). Configúrala como variable del Worker, no en el código.
