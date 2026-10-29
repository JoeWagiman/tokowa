import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.OBROOL_API_BASE || "http://localhost:3000";
const FEE_VERSI = "2026-10-v2";

export const dynamic = "force-dynamic";

function galat(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("tokowa_token")?.value;
  if (!token) {
    return galat("unauthorized", "Sesi berakhir. Masuk dulu.", 401);
  }

  let body: { nama?: unknown; setuju?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return galat("bad_request", "Body tidak valid.", 400);
  }

  const nama = typeof body.nama === "string" ? body.nama.trim().slice(0, 120) : "";
  if (nama.length < 2) {
    return galat("bad_request", "Nama toko minimal 2 karakter.", 400);
  }
  if (body.setuju !== true) {
    return galat("bad_request", "Centang persetujuan skema biaya dulu.", 400);
  }

  try {
    const buat = await fetch(new URL("/api/agents", BASE), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action: "create",
        name: nama,
        prompt: `Kamu adalah asisten operasional toko ${nama} di Tokowa. Jawab singkat dalam Bahasa Indonesia dan fokus membantu pencatatan toko.`,
        channel: "web",
      }),
      cache: "no-store",
    });
    const dataBuat = await buat.json().catch(() => null);
    const agentId = dataBuat?.agent?.id;
    if (!buat.ok || typeof agentId !== "string" || !agentId) {
      const pesan = typeof dataBuat?.error === "string" ? dataBuat.error : "Toko gagal dibuat. Coba lagi nanti.";
      return galat(buat.status === 403 ? "forbidden" : "bad_request", pesan, buat.status === 403 ? 403 : buat.status);
    }

    const aktif = await fetch(new URL(`/api/agents/${encodeURIComponent(agentId)}/toko/status`, BASE), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tokoEnabled: true, feeSetuju: true, feeVersi: FEE_VERSI }),
      cache: "no-store",
    });
    const dataAktif = await aktif.json().catch(() => null);
    if (!aktif.ok) {
      const pesan =
        typeof dataAktif?.error === "string" ? dataAktif.error : "Toko dibuat, tetapi mode toko gagal diaktifkan.";
      return NextResponse.json({ error: { code: "unavailable", message: pesan }, data: { agentId } }, { status: 502 });
    }

    return NextResponse.json({ data: { agentId, nama: dataBuat.agent?.name ?? nama } }, { status: 201 });
  } catch {
    return galat("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 503);
  }
}
