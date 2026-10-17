"use client";

import { useState } from "react";

type Setting = {
  jamBuka: string | null;
  jamTutup: string | null;
  hariBuka: string | null;
  jendelaReturHari: number;
  ongkirRetur: string | null;
  qrisStatisNama: string | null;
  qrisStatisUrl: string | null;
};

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function FormPengaturan({ agentId, setting }: { agentId: string; setting: Setting }) {
  const hariAwal = (setting.hariBuka ? setting.hariBuka.split(",").filter(Boolean) : []).map(Number);
  const [hari, setHari] = useState<Set<number>>(new Set(hariAwal));
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  function gantiHari(i: number, aktif: boolean) {
    const b = new Set(hari);
    if (aktif) b.add(i);
    else b.delete(i);
    setHari(b);
  }

  async function simpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "");
    setPesan(null);
    setSibuk(true);
    try {
      const res = await fetch(`/api/proxy/agents/${agentId}/toko/setting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jamBuka: get("jamBuka") ? get("jamBuka") : "",
          jamTutup: get("jamTutup") ? get("jamTutup") : "",
          hariBuka: hari.size ? [...hari].sort((a, b) => a - b).join(",") : "",
          jendelaReturHari: Number(get("jendelaReturHari") || 0),
          ongkirRetur: get("ongkirRetur"),
          qrisStatisNama: get("qrisStatisNama") || "",
          qrisStatisUrl: get("qrisStatisUrl") || "",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan({ jenis: "galat", teks: body?.error ?? "Gagal menyimpan pengaturan." });
        return;
      }
      setPesan({ jenis: "ok", teks: "Pengaturan tersimpan." });
    } catch {
      setPesan({ jenis: "galat", teks: "Masalah ke server. Coba lagi nanti." });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <form className="kartu" onSubmit={simpan} style={{ display: "grid", gap: 16 }}>
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Jam operasional</h2>
        <div className="baris-form">
          <label>
            Jam buka
            <input className="rincian-input" name="jamBuka" type="time" defaultValue={setting.jamBuka ?? ""} />
          </label>
          <label>
            Jam tutup
            <input className="rincian-input" name="jamTutup" type="time" defaultValue={setting.jamTutup ?? ""} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          {NAMA_HARI.map((h, i) => (
            <label key={h} style={{ display: "flex", gap: 4, fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              <input type="checkbox" checked={hari.has(i)} onChange={(e) => gantiHari(i, e.target.checked)} />
              {h}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Retur</h2>
        <div className="baris-form">
          <label>
            Jendela retur (hari, 0-30)
            <input
              className="rincian-input"
              name="jendelaReturHari"
              type="number"
              min={0}
              max={30}
              defaultValue={setting.jendelaReturHari ?? 0}
            />
          </label>
          <label>
            Ongkir retur
            <select className="rincian-input" name="ongkirRetur" defaultValue={setting.ongkirRetur ?? "pembeli"}>
              <option value="pembeli">Pembeli menanggung</option>
              <option value="toko">Toko menanggung</option>
              <option value="bagi_dua">Bagi dua</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>QRIS statis</h2>
        <div className="baris-form">
          <label>
            Nama pemilik
            <input className="rincian-input" name="qrisStatisNama" defaultValue={setting.qrisStatisNama ?? ""} maxLength={80} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            URL gambar QRIS
            <input
              className="rincian-input"
              name="qrisStatisUrl"
              type="url"
              placeholder="https://..."
              defaultValue={setting.qrisStatisUrl ?? ""}
            />
          </label>
        </div>
      </section>

      <div className="baris-aksi" style={{ margin: 0 }}>
        <button className="btn" type="submit" disabled={sibuk}>
          {sibuk ? "Menyimpan…" : "Simpan"}
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
        >
          {pesan.teks}
        </p>
      )}
    </form>
  );
}
