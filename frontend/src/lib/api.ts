const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login on auth failure
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const body = await response.text();
    let message: string;
    try {
      const json = JSON.parse(body);
      message = json.message || json.error || body;
    } catch {
      message = body || response.statusText;
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include", // sends httpOnly JWT cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
}

export const apiGet = <T>(endpoint: string) => api<T>(endpoint, { method: "GET" });

export const apiPost = <T>(endpoint: string, body?: unknown) =>
  api<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export const apiPut = <T>(endpoint: string, body?: unknown) =>
  api<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined });

export const apiPatch = <T>(endpoint: string, body?: unknown) =>
  api<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T>(endpoint: string) => api<T>(endpoint, { method: "DELETE" });
