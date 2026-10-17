import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";
const AUTORISASI = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

async function core(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (!AUTORISASI.has(method)) {
    return NextResponse.json({ error: "Metode tidak didukung" }, { status: 405 });
  }

  const token = (await cookies()).get("tokowa_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Sesi berakhir. Masuk dulu." }, { status: 401 });
  }

  const jalur = "/api" + request.nextUrl.pathname.replace(/^\/api\/proxy/, "");
  const tujuan = new URL(jalur + request.nextUrl.search, BASE);

  const res = await fetch(tujuan, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method !== "GET" && method !== "DELETE" && request.headers.get("content-type")
        ? { "Content-Type": request.headers.get("content-type") as string }
        : {}),
    },
    ...(method !== "GET" && method !== "DELETE"
      ? { body: await request.arrayBuffer() }
      : {}),
    cache: "no-store",
  });

  return new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function GET(request: NextRequest) {
  return core(request);
}

export async function POST(request: NextRequest) {
  return core(request);
}

export async function PUT(request: NextRequest) {
  return core(request);
}

export async function PATCH(request: NextRequest) {
  return core(request);
}

export async function DELETE(request: NextRequest) {
  return core(request);
}
