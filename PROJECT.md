# F Health · Círculo Fundador

Primera versión privada de la plataforma de prelanzamiento de México.

## Registro y formación

- Registro gratuito con Sign in with ChatGPT y una identidad por cuenta.
- Patrocinador vinculado al registro mediante un código único; no se modifica desde la interfaz.
- Red visible hasta tres niveles. Los descendientes no exponen correo ni identificador de autenticación.
- Seis lecciones introductorias con validación de respuesta en servidor y progreso persistente.
- Postulación a fundador y aprobación administrativa con tope de diez.
- Simulador de comisiones hipotéticas 36% / 9% / 5%, sin saldo real.

## Fuera de esta entrega

No hay integración de pagos, pedidos comerciales, comisiones devengadas, desembolsos, envío ni certificación clínica. La revisión permanece privada mientras se completan responsable legal, aviso de privacidad, ficha técnica, términos comerciales y pasarela.

## Fuente de requisitos

https://app.notion.com/p/3ed205e3987e81a1a5b3c4b921f1096b

## Producto

FH1: suplemento en polvo de 30 tomas, primer lote en producción confirmado por Carlos el 7 de octubre de 2026. Precio público de $2,500 MXN con impuestos y envío nacional incluidos. Comunicación centrada en la fórmula premium de seis ingredientes. No publicar nombres ni costos de proveedores en sitios, academia o presentaciones. Describir la investigación de ingredientes sin atribuir resultados clínicos a la mezcla; no afirmar exclusividad en toda la industria ni ahorros frente a competidores sin evidencia comparable.

## Operación técnica

Vinext + React + Cloudflare D1. Declaración de tablas en db/schema.ts. Las migraciones de drizzle/ se aplican en despliegue; no se ejecuta DDL en peticiones.

La identidad proviene únicamente de los encabezados confiables del dispatch de Sites mediante app/chatgpt-auth.ts. La cuenta administradora corresponde al correo verificado del propietario. Los encabezados sintéticos se usan exclusivamente en pruebas del entorno local; nunca constituyen un método de acceso público.

Comandos: npm run install:ci, npm run db:generate, node node_modules/typescript/bin/tsc --noEmit. Compilación y publicación con los helpers del skill Sites.

## Matriz confirmada · 6 de octubre de 2026

Base comisionable: 2,500 MXN. Nivel 1: 900 MXN; nivel 2: 225 MXN; nivel 3: 125 MXN. Total de los tres niveles: 1,250 MXN (50%). El precio de FH1 incluye impuestos y envío nacional en esta etapa. Los porcentajes y el cálculo del simulador comparten lib/commissions.ts. La lección de comisiones mantiene su identificador y evaluación para conservar el avance existente.
