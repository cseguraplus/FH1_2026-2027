# Validador local de exportación
Requiere Python 3.10 o posterior, sin dependencias externas ni red.
```sh
python3 -m unittest -v test_validator.py
python3 validate_export.py fixture.json
```
fixture.json contiene únicamente dos personas ficticias. No es un respaldo de producción.

Normalizar el export al formato format_version:1, auth_subjects:[UUID verificados] y tables con las seis tablas originales. Cada tabla debe incluir todas sus filas y los nombres de columnas D1. Puede agregarse expected_counts con conteos independientes de las seis tablas para detectar truncamiento. No incluir contraseñas ni tokens; el inventario Auth solo necesita UUID.

No imprimir el export ni adjuntarlo a Notion. Guardarlo cifrado y con acceso restringido. El script solo lee el archivo indicado y muestra conteos, categorías de error y SHA-256. Un resultado correcto no demuestra que el export sea completo o que el destino esté reconciliado; eso exige conteos independientes, snapshot consistente y comparación por fila.

request_limits es efímero y solo se cuenta. Las identidades sin perfil o perfiles anteriores aún sin vínculo se reportan para revisión; no se crean vínculos automáticamente. Un lesson_id desconocido se conserva y se marca para revisión, no se elimina.
