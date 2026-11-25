export async function api<T>(path: string, method = 'GET', body?: unknown, token?: string): Promise<T> {
  const response = await fetch('/api/' + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data as T;
}
