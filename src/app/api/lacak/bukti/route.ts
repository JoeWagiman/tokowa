import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Format unggahan tidak dikenali." } },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(new URL("/api/v1/pesanan/bukti", BASE), {
      method: "POST",
      body: form,
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
