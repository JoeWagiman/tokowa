"use client";

export type JejakPesanan = {
  kode: string;
  hp4: string;
  toko: string;
  total: number;
  dibuatAt: string;
};

const KUNCI = "tokowa-pesanan-v1";
const MAKS_JEJAK = 30;

function jejakValid(x: unknown): x is JejakPesanan {
  if (!x || typeof x !== "object") return false;
  const j = x as Record<string, unknown>;
  return (
    typeof j.kode === "string" &&
    j.kode.length > 0 &&
    typeof j.hp4 === "string" &&
    typeof j.toko === "string" &&
    typeof j.total === "number" &&
    typeof j.dibuatAt === "string"
  );
}

export function bacaRiwayat(): JejakPesanan[] {
  try {
    const raw = localStorage.getItem(KUNCI);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter(jejakValid) : [];
  } catch {
    return [];
  }
}

export function catatPesanan(jejak: JejakPesanan): void {
  try {
    const tanpaDuplikat = bacaRiwayat().filter((j) => j.kode !== jejak.kode);
    localStorage.setItem(KUNCI, JSON.stringify([jejak, ...tanpaDuplikat].slice(0, MAKS_JEJAK)));
  } catch {
    return;
  }
}

export function kosongkanRiwayat(): void {
  try {
    localStorage.removeItem(KUNCI);
  } catch {
    return;
  }
}
