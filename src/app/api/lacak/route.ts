import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const kode = request.nextUrl.searchParams.get("kode") ?? "";
  const hp = request.nextUrl.searchParams.get("hp") ?? "";

  if (!kode.trim() || !hp.trim()) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Isi kode pesanan dan 4 angka terakhir nomor WhatsApp." } },
      { status: 400 }
    );
  }

  const tujuan = new URL("/api/v1/pesanan/lacak", BASE);
  tujuan.searchParams.set("kode", kode);
  tujuan.searchParams.set("hp", hp);

  try {
    const res = await fetch(tujuan, { cache: "no-store" });
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
