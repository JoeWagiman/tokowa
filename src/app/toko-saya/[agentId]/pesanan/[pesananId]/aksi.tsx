"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Aksi = "konfirmasi" | "tolak" | "kirim" | "selesai" | "batal";

const OPSI: Record<string, Array<{ aksi: Aksi; label: string; ok: string; kelas?: string; tanya?: string }>> = {
  tunggu_bayar: [
    { aksi: "batal", label: "Batalkan pesanan", ok: "Pesanan dibatalkan.", kelas: "b-model" },
  ],
  tunggu_verifikasi: [
    { aksi: "konfirmasi", label: "Konfirmasi terbayar", ok: "Pesanan ditandai terbayar." },
    { aksi: "tolak", label: "Tolak bukti", ok: "Bukti ditolak, pesanan dibatalkan.", kelas: "b-model" },
    { aksi: "batal", label: "Batalkan pesanan", ok: "Pesanan dibatalkan.", kelas: "b-model" },
  ],
  paid: [
    { aksi: "kirim", label: "Sudah dikirim", ok: "Pesanan ditandai dikirim." },
  ],
  kirim: [
    { aksi: "selesai", label: "Selesai", ok: "Pesanan selesai." },
  ],
};

export function AksiPesanan({ agentId, pesananId, status }: { agentId: string; pesananId: string; status: string }) {
  const router = useRouter();
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const opsi = OPSI[status] ?? [];

  async function jalankan(o: { aksi: Aksi; ok: string; tanya?: string }) {
    if (o.tanya && !window.confirm(o.tanya)) return;
    const res = await fetch(`/api/proxy/v1/seller/pesanan/${pesananId}/aksi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: o.aksi }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setPesan({ jenis: "galat", teks: body?.error?.message ?? "Aksi gagal." });
      return;
    }
    setPesan({ jenis: "ok", teks: o.ok });
    router.refresh();
  }

  if (opsi.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div className="baris-aksi">
        {opsi.map((o) => (
          <button key={o.aksi} className={o.kelas ? "btn btn-ghost" : "btn"} onClick={() => void jalankan(o)} title={o.kelas ? "Tindakan tidak dapat dibatalkan" : undefined}>
            {o.label}
          </button>
        ))}
      </div>
      {pesan && (
        <p
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 14,
            background: pesan.jenis === "ok" ? "var(--ok-soft)" : "var(--danger-soft)",
            color: pesan.jenis === "ok" ? "var(--ok-ink)" : "var(--danger-ink)",
          }}
        >
          {pesan.teks}
        </p>
      )}
    </div>
  );
}
