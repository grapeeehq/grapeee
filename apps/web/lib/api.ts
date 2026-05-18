export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function getRuntimeStatus() {
  const response = await fetch(`${apiBaseUrl}/runtime/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Runtime status failed: ${response.status}`);
  }

  return response.json() as Promise<{
    connected: boolean;
    mode: string;
    message: string;
  }>;
}

