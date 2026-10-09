// Registro de errores sin datos personales. Cada falla inesperada deja una línea
// JSON con un identificador que también viaja en el encabezado X-Request-Id, de
// modo que una queja de un usuario se puede ligar a su registro.

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

export function requestId(request?: Request): string {
  return request?.headers.get("cf-ray") ?? crypto.randomUUID();
}

export function logError(scope: string, error: unknown, id: string) {
  const name = error instanceof Error ? error.name : typeof error;
  const raw = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      event: "unhandled_error",
      scope,
      requestId: id,
      name,
      message: raw.replace(EMAIL, "[correo]").slice(0, 200),
    }),
  );
}
