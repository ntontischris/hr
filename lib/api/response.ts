export function success<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function error(
  message: string,
  status: number,
  details?: Record<string, unknown>,
): Response {
  return Response.json(
    { error: { message, ...(details ? { details } : {}) } },
    { status },
  );
}
