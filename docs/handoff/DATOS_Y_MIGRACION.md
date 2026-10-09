# Datos y migración

## Mapeo del origen D1
| Origen | Destino propuesto | Conservación |
| --- | --- | --- |
| profiles.user_id | migration_map.legacy_user_id | Identificador original inmutable para reconciliar |
| profiles.public_id | members.id | Conservar UUID público |
| name y city | members.display_name y city | Mínimo visible según rol |
| referral_code | commercial_cycles.referral_code inicial | Conservar todos los enlaces existentes |
| sponsor_id | sponsorship_edges | Resolver con mapa de IDs; mantener nulos, no inventar raíces |
| wants_founder y founder | members | Indicadores comerciales, nunca roles administrativos |
| consent_version y created_at | consents | Conservar evidencia histórica: el timestamp de alta acompaña aceptación; no inventar IP o versión de texto |
| progress | lesson_completions legado | Conservar lesson_id y completed_at; no acreditar videos nuevos |
| auth_links | identity_links | provider_subject de Supabase y miembro vinculado uno a uno |
| audit | audit_events legado | ID, actor, sujeto, acción y fecha; resolver o preservar IDs históricos |
| site_admin | staff_roles | Asignación explícita verificada y auditada; no inferir por nombre o email |
| request_limits | Contadores nuevos | Efímeros, reiniciables; no son historial comercial |

## Identidad
La prioridad de resolución es auth_links validado; después el prefijo fh-email:UUID verificado en Auth. Un UUID de Auth no puede apuntar a dos miembros y un miembro no puede recibir dos cuentas del mismo proveedor sin una resolución explícita. Conservar perfiles anteriores sin vínculo como pendientes de reclamación, con su red intacta.

El claim de legado exige prueba de control de ambas identidades o un procedimiento de soporte aprobado y auditado. Nunca permitir que el solicitante elija libremente el legacy_user_id. No unir por correo declarado.

## Modelo objetivo
diccionario-datos.json define entidades, claves y restricciones propuestas. No es una migración SQL ejecutada. Claudio debe producir migraciones versionadas con rollback o estrategia de avance, políticas RLS y pruebas de constraints. Mantener foreign keys en historia; bloquear borrado físico de entidades con movimientos financieros.

Organización:
- sponsor original y sponsor operativo tienen significado distinto.
- Una arista está asociada a un ciclo y tiene valid_from, valid_to y motivo.
- Solo una arista operativa vigente por ciclo; cambio con control de concurrencia.
- Prohibir autorreferencia y ciclos mediante comprobación transaccional, no solo en el frontend.
- Reingreso crea un ciclo nuevo; mantiene persona e historial. Código nuevo o anterior queda sujeto a D04 y al tratamiento de enlaces antiguos.

Libro financiero:
- Asientos inmutables, monto entero con signo, moneda, relación de reversión y regla aplicada.
- Estados calculado, retenido, disponible y liquidado no sustituyen la evidencia del movimiento.
- Tabla de asignaciones conserva comprador, beneficiario y nivel efectivo; el origen es la unidad de pedido.
- Una liquidación debe conciliar suma de ítems con total bruto, ajustes, retenciones y neto.
- Conciliación monetaria por moneda; no sumar monedas distintas.

## Procedimiento de corte
1. Inventario y conteos antes de exportar. Identificar crecimiento desde este corte.
2. Respaldo consistente: export oficial D1 si el acceso de hosting lo permite; alternativa, herramienta administrada con escrituras detenidas y paginación exhaustiva. El acceso Sites no implica tener permisos directos de Cloudflare.
3. Guardar export cifrado fuera de repositorios y Notion, con lista de destinatarios restringida. No hacer público un enlace.
4. Transformar en staging y generar mapa determinista. Dos pases para padres/hijos.
5. Validar claves, filas, vínculos, fechas y ciclos. Conservar originales para revisión de conflictos.
6. Comparar por fila normalizada, no solo por total. Validar cada código y arista, fundador y progreso.
7. Ensayar las cuentas de cada tipo con datos de prueba; mantener producción sin cambios hasta aceptación.
8. Corte final con un solo escritor. Procesar delta bajo el mismo criterio de consistencia.
9. Recontar y probar flujo mínimo; guardar acta de conciliación y hora exacta.
10. Retener origen en modo lectura según política de conservación; no borrarlo al terminar.

El validador incluido consume JSON normalizado con las seis tablas originales y auth_subjects (solo UUID de inventario Auth verificado). Se ejecuta localmente. Su salida muestra únicamente conteos y categorías de error; no imprime filas ni identidades.

## Reversión y respaldos
Antes de activar escrituras nuevas, puede regresarse al origen si las pruebas fallan y no existe divergencia. Después de nuevas operaciones, detener escrituras y conciliar pedidos, pagos, progreso y eventos antes de revertir. No restaurar a ciegas una base anterior.

El respaldo de Postgres no cubre por sí solo los objetos de Storage ni videos. Definir copia de recursos, permisos, subtítulos y originales; probar restauración completa. RPO/RTO del documento son objetivos propuestos, no capacidades contratadas.
