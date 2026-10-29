import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { nama?: unknown; email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: { code: "bad_request", message: "Body tidak valid." } }, { status: 400 });
  }
  if (typeof body.nama !== "string" || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Nama, email, dan password wajib diisi." } },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(new URL("/api/auth/register", BASE), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: body.nama, email: body.email, password: body.password }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const pesan =
        typeof data?.error === "string" ? data.error : "Pendaftaran gagal. Periksa data lalu coba lagi.";
      return NextResponse.json(
        {
          error: {
            code: res.status === 409 ? "conflict" : res.status === 429 ? "rate_limited" : "bad_request",
            message: pesan,
          },
        },
        { status: res.status }
      );
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "unavailable", message: "Layanan sedang tidak tersedia. Coba lagi nanti." } },
      { status: 503 }
    );
  }
}
