"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rp } from "@/lib/format";

type AksiRetur = "setuju" | "tolak" | "terima_barang" | "refund";

export function AksiRetur({
  returId,
  status,
  totalSaran,
}: {
  returId: string;
  status: string;
  totalSaran: number;
}) {
  const router = useRouter();
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [bukaRefund, setBukaRefund] = useState(false);
  const [nominal, setNominal] = useState(String(totalSaran || 0));
  const [catatan, setCatatan] = useState("");
  const [layakJual, setLayakJual] = useState(true);

  async function jalankan(aksi: AksiRetur, tambahan: Record<string, unknown> = {}) {
    setSibuk(true);
    setPesan(null);
    try {
      const res = await fetch(`/api/proxy/v1/seller/retur/${returId}/aksi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi, ...tambahan }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan({ jenis: "galat", teks: body?.error?.message ?? "Aksi retur gagal." });
        return;
      }
      setPesan({ jenis: "ok", teks: body?.data?.pesan ?? "Retur diperbarui." });
      setBukaRefund(false);
      router.refresh();
    } catch {
      setPesan({ jenis: "galat", teks: "Tidak bisa menghubungi server. Coba lagi." });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div>
      <div className="baris-aksi">
        {status === "diajukan" && (
          <>
            <button className="btn" type="button" disabled={sibuk} onClick={() => void jalankan("setuju")}>
              Setujui retur
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={sibuk}
              onClick={() => {
                if (window.confirm("Tolak retur ini? Pembeli akan melihat status ditolak.")) void jalankan("tolak");
              }}
            >
              Tolak retur
            </button>
          </>
        )}

        {status === "disetujui" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={layakJual} onChange={(e) => setLayakJual(e.target.checked)} />
              Barang masih layak jual, stok kembali
            </label>
            <button
              className="btn"
              type="button"
              disabled={sibuk}
              onClick={() => void jalankan("terima_barang", { layakJual })}
            >
              Barang sudah diterima
            </button>
          </>
        )}

        {status === "barang_diterima" && !bukaRefund && (
          <button className="btn" type="button" disabled={sibuk} onClick={() => setBukaRefund(true)}>
            Catat refund
          </button>
        )}

        {status === "barang_diterima" && bukaRefund && (
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor={`nominal-${returId}`}>Nominal refund (rupiah)</label>
            <input
              id={`nominal-${returId}`}
              className="rincian-input"
              inputMode="numeric"
              value={nominal}
              onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
              style={{ maxWidth: 220 }}
            />
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Total pesanan {rp(totalSaran)}. Boleh sebagian bila hanya satu barang yang diretur.
            </p>
            <label htmlFor={`catatan-${returId}`}>Catatan transfer (opsional)</label>
            <input
              id={`catatan-${returId}`}
              className="rincian-input"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              maxLength={200}
              placeholder="Contoh: transfer BCA atas nama toko"
            />
            <div className="baris-aksi">
              <button
                className="btn"
                type="button"
                disabled={sibuk}
                onClick={() => void jalankan("refund", { nominal: Number(nominal), catatan: catatan.trim() || null })}
              >
                {sibuk ? "Menyimpan" : "Simpan refund"}
              </button>
              <button className="btn btn-ghost" type="button" disabled={sibuk} onClick={() => setBukaRefund(false)}>
                Urungkan
              </button>
            </div>
          </div>
        )}
      </div>

      {pesan && (
        <p
          style={{
            marginTop: 10,
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
