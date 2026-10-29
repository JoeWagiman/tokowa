import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BATAS_PER_JAM = 10;
const hitung: Map<string, { n: number; reset: number }> = new Map();

function boleh(ip: string): boolean {
  const kini = Date.now();
  const catat = hitung.get(ip);
  if (!catat || kini > catat.reset) {
    hitung.set(ip, { n: 1, reset: kini + 3_600_000 });
    return true;
  }
  catat.n += 1;
  return catat.n <= BATAS_PER_JAM;
}

function galat(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

const digit = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!boleh(ip)) {
    return galat("rate_limited", "Terlalu banyak percobaan. Coba lagi nanti.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return galat("bad_request", "Body tidak valid.", 400);
  }

  const nama = typeof body.nama === "string" ? body.nama.trim().slice(0, 80) : "";
  if (nama.length < 2) {
    return galat("bad_request", "Isi namamu dulu.", 400);
  }
  const whatsapp = digit(body.whatsapp);
  if (whatsapp.length < 9 || whatsapp.length > 15) {
    return galat("bad_request", "Nomor WhatsApp belum benar. Contoh: 081234567890.", 400);
  }
  const emailMentah = typeof body.email === "string" ? body.email.trim() : "";
  if (emailMentah && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailMentah)) {
    return galat("bad_request", "Email tidak valid. Kosongkan bila tidak ada.", 400);
  }

  const tujuan = process.env.WAITLIST_FORWARD_URL?.trim() ?? "";
  if (!tujuan) {
    return galat("unavailable", "Pendaftaran belum dibuka. Coba lagi nanti.", 503);
  }

  try {
    const res = await fetch(tujuan, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama,
        whatsapp,
        email: emailMentah || null,
        sumber: "tokowa.app",
        waktu: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json({ data: { ok: true } }, { status: 201 });
  } catch {
    return galat("unavailable", "Gagal menyimpan. Coba lagi nanti.", 502);
  }
}
