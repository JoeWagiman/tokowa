"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rp } from "@/lib/format";

export function AksiSengketaToko({
  sengketaId,
  totalSaran,
}: {
  sengketaId: string;
  totalSaran: number;
}) {
  const router = useRouter();
  const [pilihan, setPilihan] = useState<"setuju" | "tolak" | null>(null);
  const [nominal, setNominal] = useState(String(totalSaran || 0));
  const [alasan, setAlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);

  async function kirim() {
    if (!pilihan) return;
    if (pilihan === "setuju") {
      const n = Number(nominal);
      if (!Number.isInteger(n) || n <= 0) {
        setPesan({ jenis: "galat", teks: "Nominal refund harus angka rupiah lebih dari nol." });
        return;
      }
      if (!window.confirm(`Setujui refund ${rp(n)} untuk sengketa ini? Saldo toko dicatat berkurang sebesar itu.`)) return;
    }
    if (pilihan === "tolak" && alasan.trim().length < 3) {
      setPesan({ jenis: "galat", teks: "Tuliskan alasan penolakan untuk admin dan pembeli." });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      const res = await fetch(`/api/proxy/v1/seller/sengketa/${sengketaId}/aksi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aksi: pilihan,
          ...(pilihan === "setuju" ? { nominal: Number(nominal) } : { alasan: alasan.trim() }),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan({ jenis: "galat", teks: body?.error?.message ?? "Aksi sengketa gagal." });
        return;
      }
      setPesan({ jenis: "ok", teks: body?.data?.pesan ?? "Jawaban terkirim." });
      router.refresh();
    } catch {
      setPesan({ jenis: "galat", teks: "Tidak bisa menghubungi server. Coba lagi." });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
      <div className="baris-aksi" role="group" aria-label="Jawaban sengketa">
        <button
          className={`btn ${pilihan === "setuju" ? "" : "btn-ghost"}`}
          type="button"
          onClick={() => setPilihan("setuju")}
        >
          Setujui refund
        </button>
        <button
          className={`btn ${pilihan === "tolak" ? "" : "btn-ghost"}`}
          type="button"
          onClick={() => setPilihan("tolak")}
        >
          Tolak, naikkan ke admin
        </button>
      </div>

      {pilihan === "setuju" && (
        <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <label htmlFor={`nominal-${sengketaId}`}>Nominal refund (rupiah)</label>
          <input
            id={`nominal-${sengketaId}`}
            className="rincian-input"
            inputMode="numeric"
            value={nominal}
            onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
          />
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Total pesanan {rp(totalSaran)}. Menyetujui di tahap ini menutup sengketa tanpa
            teguran. Transfer tetap kamu kirim sendiri ke pembeli.
          </p>
        </div>
      )}

      {pilihan === "tolak" && (
        <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
          <label htmlFor={`alasan-${sengketaId}`}>Alasan penolakan</label>
          <input
            id={`alasan-${sengketaId}`}
            className="rincian-input"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            maxLength={300}
            placeholder="Contoh: barang sesuai foto dan deskripsi katalog"
          />
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Admin membaca alasan ini. Bila admin memenangkan pembeli, toko kena teguran.
          </p>
        </div>
      )}

      {pilihan && (
        <div className="baris-aksi">
          <button className="btn" type="button" disabled={sibuk} onClick={() => void kirim()}>
            {sibuk ? "Mengirim" : "Kirim jawaban"}
          </button>
          <button className="btn btn-ghost" type="button" disabled={sibuk} onClick={() => setPilihan(null)}>
            Urungkan
          </button>
        </div>
      )}

      {pesan && (
        <p
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 14,
            background: pesan.jenis === "ok" ? "var(--ok-soft)" : "var(--danger-soft)",
            color: pesan.jenis === "ok" ? "var(--ok-ink)" : "var(--danger-ink)",
          }}
          role="status"
        >
          {pesan.teks}
        </p>
      )}
    </div>
  );
}
