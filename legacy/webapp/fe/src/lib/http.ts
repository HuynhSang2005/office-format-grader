export async function assertOk(response: Response, fallbackMessage: string) {
  if (response.ok) return;
  let message = fallbackMessage;

  const ct = response.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const data = await response.json();
      message = data?.error?.message || data?.message || message;
    } else {
      const text = await response.text();
      message = text || message;
    }
  } catch {
    // giữ fallback
  }
  throw new Error(message);
}