"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KeputusanKyc({ id }: { id: string }) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  async function putuskan(keputusan: "diterima" | "ditolak") {
    if (keputusan === "ditolak" && !catatan.trim()) {
      setGalat("Tuliskan alasan penolakan.");
      return;
    }
    setSibuk(true);
    setGalat("");
    try {
      const res = await fetch(`/api/proxy/v1/admin/kyc/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keputusan, catatan: keputusan === "ditolak" ? catatan.trim() : undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Aksi gagal.");
      router.refresh();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Aksi gagal.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <textarea
        className="rincian-input"
        rows={2}
        placeholder="Catatan untuk penjual (wajib saat menolak)"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
      />
      <div className="baris-aksi" style={{ margin: 0 }}>
        <button className="btn" disabled={sibuk} onClick={() => void putuskan("diterima")}>
          Terima
        </button>
        <button className="btn btn-ghost" disabled={sibuk} onClick={() => void putuskan("ditolak")}>
          Tolak
        </button>
      </div>
      {galat && <p style={{ color: "var(--danger-ink)", fontSize: 13 }}>{galat}</p>}
    </div>
  );
}
