const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type Opts = {
  search?: Record<string, string | undefined>;
  token?: string;
  init?: RequestInit;
};

export async function obrool<T>(path: string, { search, token, init }: Opts = {}): Promise<T> {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(search ?? {})) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = (body && (body.error ?? body)) as { code?: string; message?: string } | string | null;
    const code = typeof err === "object" && err && "code" in err ? String(err.code) : "unavailable";
    const message =
      typeof err === "string"
        ? err
        : err?.message || "Layanan sedang tidak tersedia. Coba lagi nanti.";
    throw new ApiError(code, message, res.status);
  }

  return (body && body.data !== undefined ? body.data : body) as T;
}

export function waLink(text: string) {
  const no = process.env.NEXT_PUBLIC_WA_NUMBER || "";
  if (!no) return null;
  return `https://wa.me/${no}?text=${encodeURIComponent(text)}`;
}
