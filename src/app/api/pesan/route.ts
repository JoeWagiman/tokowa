import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "bad_request", message: "Body tidak valid." } }, { status: 400 });
  }

  try {
    const res = await fetch(new URL("/api/v1/pesanan", BASE), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return new NextResponse(await res.arrayBuffer(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "unavailable", message: "Layanan sedang tidak tersedia. Coba lagi nanti." } },
      { status: 503 }
    );
  }
}
