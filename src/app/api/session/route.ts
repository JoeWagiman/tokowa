import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Email dan password wajib diisi." } },
        { status: 400 }
      );
    }

    const res = await fetch(new URL("/api/auth/login", BASE), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.token) {
      const pesan =
        body?.error ?? "Masalah ke server. Periksa kembali email dan password-mu.";
      return NextResponse.json(
        { error: { code: res.status === 429 ? "rate_limited" : "auth", message: pesan } },
        { status: res.status === 429 ? 429 : 401 }
      );
    }

    const simpan = (await cookies()).set("tokowa_token", body.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    await simpan;

    return NextResponse.json({
      data: { user: body.user },
    });  } catch (error) {
    console.error("[session]", error);
    return NextResponse.json(
      { error: { code: "unavailable", message: "Layanan sedang tidak tersedia" } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookie = await cookies();
  cookie.get("tokowa_token") && cookie.set("tokowa_token", "", { path: "/", maxAge: 0 });
  return NextResponse.json({ data: null });
}
