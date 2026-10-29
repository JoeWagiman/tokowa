"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BuatToko() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan(null);
    setSibuk(true);
    try {
      const res = await fetch("/api/toko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, setuju }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan({ jenis: "galat", teks: body?.error?.message ?? "Toko gagal dibuat. Coba lagi nanti." });
        return;
      }
      setPesan({ jenis: "ok", teks: `Toko ${body?.data?.nama ?? nama} siap. Lengkapi produk dan pengaturannya.` });
      setNama("");
      setSetuju(false);
      router.refresh();
    } catch {
      setPesan({ jenis: "galat", teks: "Tidak bisa menghubungi server. Coba lagi." });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <form className="kartu" onSubmit={kirim} style={{ display: "grid", gap: 12, marginTop: 16 }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Buat toko</h2>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Cukup nama toko. Setelah dibuat, lengkapi produk dan pengaturan tokonya.
        </p>
      </div>
      <label>
        Nama toko
        <input
          className="rincian-input"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          maxLength={120}
          placeholder="Contoh: Warung Barokah"
          required
        />
      </label>
      <label style={{ display: "flex", gap: 8, fontSize: 14, alignItems: "flex-start" }}>
        <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
        <span>
          Saya menyetujui skema biaya 2026-10-v2. Obrool tidak memotong uang jualan; biaya hanya
          dari kanal berbayar bila dipakai, dan gratis bila pembeli membayar ke QRIS statis milikku.
        </span>
      </label>
      <div className="baris-aksi" style={{ margin: 0 }}>
        <button className="btn" type="submit" disabled={sibuk || nama.trim().length < 2 || !setuju}>
          {sibuk ? "Membuat toko…" : "Buat toko"}
        </button>
      </div>
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
    </form>
  );
}
