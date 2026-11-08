const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: { display_name?: string };
    app_metadata?: { role?: string; [key: string]: unknown };
  };
};

export class SupabaseError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SupabaseError";
    this.status = status;
    this.code = code;
  }
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function readResponse(response: Response) {
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SupabaseError(
      data?.msg || data?.message || data?.error_description || data?.hint || "Não foi possível concluir a operação.",
      response.status,
      data?.code || data?.error
    );
  }
  return data;
}

export async function authRequest(path: string, body?: unknown, token?: string) {
  if (!isSupabaseConfigured()) throw new Error("O Kotoba Quest ainda não está conectado ao Supabase.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body ?? {})
  });
  return readResponse(response);
}

export async function restRequest(path: string, token: string, init: RequestInit = {}) {
  if (!isSupabaseConfigured()) throw new Error("O Kotoba Quest ainda não está conectado ao Supabase.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  return readResponse(response);
}

export function withExpiry(session: Session): Session {
  if (session.expires_at) return session;
  return { ...session, expires_at: Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600) };
}
