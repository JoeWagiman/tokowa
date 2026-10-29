"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rp } from "@/lib/format";

export function KeputusanSengketa({ id, totalSaran }: { id: string; totalSaran: number }) {
  const router = useRouter();
  const [pilihan, setPilihan] = useState<"untuk_pembeli" | "untuk_toko" | null>(null);
  const [nominal, setNominal] = useState(String(totalSaran || 0));
  const [catatan, setCatatan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);

  async function putuskan() {
    if (!pilihan) return;
    if (pilihan === "untuk_pembeli") {
      const n = Number(nominal);
      if (!Number.isInteger(n) || n < 0) {
        setPesan({ jenis: "galat", teks: "Nominal refund harus angka rupiah 0 atau lebih." });
        return;
      }
      if (n > 0 && !window.confirm(`Putuskan untuk pembeli dengan refund ${rp(n)}? Saldo toko dipotong sebesar itu.`)) return;
    }
    if (pilihan === "untuk_toko" && catatan.trim().length < 3) {
      setPesan({ jenis: "galat", teks: "Tuliskan alasan keputusan untuk toko." });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      const res = await fetch(`/api/proxy/v1/admin/sengketa/${id}/aksi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keputusan: pilihan,
          ...(pilihan === "untuk_pembeli" ? { refundTotal: Number(nominal) } : {}),
          catatan: catatan.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan({ jenis: "galat", teks: body?.error?.message ?? "Putusan gagal disimpan." });
        return;
      }
      setPesan({ jenis: "ok", teks: body?.data?.pesan ?? "Putusan tersimpan." });
      router.refresh();
    } catch {
      setPesan({ jenis: "galat", teks: "Tidak bisa menghubungi server. Coba lagi." });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="baris-aksi" role="group" aria-label="Pilih putusan">
        <button
          className={`btn ${pilihan === "untuk_pembeli" ? "" : "btn-ghost"}`}
          type="button"
          onClick={() => setPilihan("untuk_pembeli")}
        >
          Untuk pembeli
        </button>
        <button
          className={`btn ${pilihan === "untuk_toko" ? "" : "btn-ghost"}`}
          type="button"
          onClick={() => setPilihan("untuk_toko")}
        >
          Untuk toko
        </button>
      </div>

      {pilihan === "untuk_pembeli" && (
        <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <label htmlFor={`refund-${id}`}>Nominal refund ke pembeli (rupiah)</label>
          <input
            id={`refund-${id}`}
            className="rincian-input"
            inputMode="numeric"
            value={nominal}
            onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
          />
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Total pesanan {rp(totalSaran)}. Isi 0 bila pembeli menang tanpa pengembalian uang.
          </p>
        </div>
      )}

      {pilihan && (
        <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
          <label htmlFor={`catatan-${id}`}>
            Catatan putusan {pilihan === "untuk_toko" ? "(wajib)" : "(opsional)"}
          </label>
          <input
            id={`catatan-${id}`}
            className="rincian-input"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            maxLength={600}
            placeholder={pilihan === "untuk_toko" ? "Alasan untuk toko" : "Catatan singkat untuk catatan admin"}
          />
          <div className="baris-aksi">
            <button className="btn" type="button" disabled={sibuk} onClick={() => void putuskan()}>
              {sibuk ? "Menyimpan" : "Simpan putusan"}
            </button>
            <button className="btn btn-ghost" type="button" disabled={sibuk} onClick={() => setPilihan(null)}>
              Urungkan
            </button>
          </div>
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
