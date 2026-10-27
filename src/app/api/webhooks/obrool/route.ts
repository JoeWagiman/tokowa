import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JENDELA_DETIK = 300;
const MAKS_INGAT = 1000;

const sudahDiterima = new Set<string>();
const urutanDiterima: string[] = [];

function ingat(id: string) {
  sudahDiterima.add(id);
  urutanDiterima.push(id);
  if (urutanDiterima.length > MAKS_INGAT) {
    const lama = urutanDiterima.shift();
    if (lama) sudahDiterima.delete(lama);
  }
}

function galat(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const secret = process.env.OBROOL_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return galat("not_configured", "Penerima webhook belum dikonfigurasi.", 503);
  }

  const ts = request.headers.get("x-tokowa-timestamp");
  const sig = request.headers.get("x-tokowa-signature");
  if (!ts || !sig) {
    return galat("unauthorized", "Tanda tangan webhook tidak ada.", 401);
  }
  const tsAngka = Number(ts);
  if (!Number.isFinite(tsAngka) || Math.abs(Date.now() / 1000 - tsAngka) > JENDELA_DETIK) {
    return galat("unauthorized", "Tanda tangan webhook sudah kedaluwarsa.", 401);
  }

  const raw = await request.text();
  const harapan = `sha256=${createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex")}`;
  const a = Buffer.from(harapan);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return galat("unauthorized", "Tanda tangan webhook tidak cocok.", 401);
  }

  let acara: { id?: unknown; type?: unknown; occurredAt?: unknown; data?: unknown };
  try {
    acara = JSON.parse(raw) as typeof acara;
  } catch {
    return galat("bad_request", "Body webhook bukan JSON.", 400);
  }
  if (typeof acara.id !== "string" || !acara.id || typeof acara.type !== "string" || !acara.type) {
    return galat("bad_request", "Webhook tanpa id atau type.", 400);
  }

  if (sudahDiterima.has(acara.id)) {
    return NextResponse.json({ data: { received: true, duplikat: true } });
  }
  ingat(acara.id);

  console.info("[webhook-obrool]", acara.type, acara.id);
  return NextResponse.json({ data: { received: true } });
}
