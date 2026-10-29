"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CabutSuspensi({ agentId, nama }: { agentId: string; nama: string }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  async function cabut() {
    if (!window.confirm(`Cabut suspensi ${nama}? Toko bisa menerima pesanan baru lagi. Teguran tidak ikut terhapus.`)) return;
    setSibuk(true);
    setGagal(null);
    try {
      const res = await fetch("/api/proxy/v1/admin/suspensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGagal(body?.error?.message ?? "Gagal mencabut suspensi.");
        return;
      }
      router.refresh();
    } catch {
      setGagal("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <span>
      <button
        className="btn btn-ghost"
        type="button"
        style={{ padding: "5px 12px", fontSize: 13 }}
        disabled={sibuk}
        onClick={() => void cabut()}
      >
        {sibuk ? "Mencabut" : "Cabut suspensi"}
      </button>
      {gagal && (
        <span style={{ color: "var(--danger-ink)", fontSize: 12, display: "block", marginTop: 4 }}>{gagal}</span>
      )}
    </span>
  );
}
