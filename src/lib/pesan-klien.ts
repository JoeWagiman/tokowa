"use client";

import { useEffect, useState } from "react";

export type ModeKirim = "self_pickup" | "seller_delivery" | "courier_instant";

export const PILIHAN_MODE: { nilai: ModeKirim; label: string }[] = [
  { nilai: "self_pickup", label: "Ambil di toko" },
  { nilai: "seller_delivery", label: "Diantar toko" },
  { nilai: "courier_instant", label: "Kurir instan" },
];

export type BarisPesan = { produkId: string; qty: number };

export type Kutipan = {
  subtotal: number;
  ongkir: number | null;
  total: number | null;
  catatan: string | null;
};

export function useKutipan(agentId: string, items: BarisPesan[], mode: ModeKirim) {
  const [kutipan, setKutipan] = useState<Kutipan | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const kunciBaris = JSON.stringify(items);

  useEffect(() => {
    if (!agentId || items.length === 0) {
      setKutipan(null);
      return;
    }
    let batal = false;
    const t = setTimeout(async () => {
      setMemuat(true);
      try {
        const res = await fetch("/api/pesan/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, items, mode }),
        });
        const body = await res.json().catch(() => null);
        if (batal) return;
        if (!res.ok) {
          setGalat(body?.error?.message ?? "Tidak bisa menghitung total.");
          setKutipan(null);
        } else {
          setGalat(null);
          setKutipan(body.data as Kutipan);
        }
      } catch {
        if (!batal) {
          setGalat("Masalah ke server. Coba lagi nanti.");
          setKutipan(null);
        }
      } finally {
        if (!batal) setMemuat(false);
      }
    }, 250);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [agentId, kunciBaris, mode]);

  return { kutipan, memuat, galat };
}

export function validasiPesanan(pelanggan: string, mode: ModeKirim, alamat: string): string | null {
  const digit = pelanggan.replace(/\D/g, "");
  if (digit.length < 9 || digit.length > 15) {
    return "Nomor WhatsApp belum benar. Contoh: 081234567890.";
  }
  if (mode === "seller_delivery" && alamat.trim().length < 5) {
    return "Isi alamat pengiriman dulu, minimal 5 karakter.";
  }
  return null;
}

export type PayloadPesanan = {
  agentId: string;
  items: BarisPesan[];
  mode: ModeKirim;
  pelanggan: string;
  alamat: string;
  idempotencyKey: string;
};

export async function kirimPesanan(
  p: PayloadPesanan
): Promise<{ ok: true; kode: string } | { ok: false; pesan: string }> {
  try {
    const res = await fetch("/api/pesan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, pesan: body?.error?.message ?? "Pesanan gagal dibuat." };
    return { ok: true, kode: String(body?.data?.kode ?? "") };
  } catch {
    return { ok: false, pesan: "Masalah ke server. Coba lagi nanti." };
  }
}

export function kunciIdempotensi(awalan: string): string {
  return `web-${awalan}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
