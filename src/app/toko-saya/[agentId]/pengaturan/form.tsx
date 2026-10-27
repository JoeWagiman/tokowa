"use client";

import { useState } from "react";

type Setting = {
  jamBuka: string | null;
  jamTutup: string | null;
  hariBuka: string | null;
  jendelaReturHari: number;
  ongkirRetur: string | null;
  ongkirSellerFlat: number | null;
  kurirInstanDasar: number | null;
  kurirInstanPerKm: number | null;
  kurirInstanJarakMaksKm: number | null;
  lat: number | null;
  lng: number | null;
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
          ongkirSellerFlat: get("ongkirSellerFlat") === "" ? "" : Number(get("ongkirSellerFlat")),
          kurirInstanDasar: get("kurirInstanDasar") === "" ? "" : Number(get("kurirInstanDasar")),
          kurirInstanPerKm: get("kurirInstanPerKm") === "" ? "" : Number(get("kurirInstanPerKm")),
          kurirInstanJarakMaksKm: get("kurirInstanJarakMaksKm") === "" ? "" : Number(get("kurirInstanJarakMaksKm")),
          lat: get("lat") === "" ? "" : Number(get("lat")),
          lng: get("lng") === "" ? "" : Number(get("lng")),
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
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Pengiriman</h2>
        <div className="baris-form">
          <label>
            Ongkir kirim sendiri (Rp)
            <input
              className="rincian-input"
              name="ongkirSellerFlat"
              type="number"
              min={0}
              max={1000000}
              step={500}
              placeholder="mis. 8000"
              defaultValue={setting.ongkirSellerFlat ?? ""}
            />
          </label>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
          Dipakai saat pembeli memilih "diantar toko" di web. Kosongkan bila belum ada tarif tetap, pembeli diarahkan
          memilih ambil di toko atau bertanya lewat WhatsApp.
        </p>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Kurir instan</h3>
        <div className="baris-form">
          <label>
            Tarif dasar (Rp, termasuk 3 km pertama)
            <input
              className="rincian-input"
              name="kurirInstanDasar"
              type="number"
              min={0}
              max={1000000}
              step={500}
              placeholder="mis. 10000"
              defaultValue={setting.kurirInstanDasar ?? ""}
            />
          </label>
          <label>
            Per km berikutnya (Rp)
            <input
              className="rincian-input"
              name="kurirInstanPerKm"
              type="number"
              min={0}
              max={100000}
              step={100}
              placeholder="mis. 2500"
              defaultValue={setting.kurirInstanPerKm ?? ""}
            />
          </label>
          <label>
            Jarak maks (km, kosong = tanpa batas)
            <input
              className="rincian-input"
              name="kurirInstanJarakMaksKm"
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="mis. 15"
              defaultValue={setting.kurirInstanJarakMaksKm ?? ""}
            />
          </label>
        </div>
        <div className="baris-form" style={{ marginTop: 12 }}>
          <label>
            Titik toko: latitude
            <input
              className="rincian-input"
              name="lat"
              type="number"
              step="any"
              min={-90}
              max={90}
              placeholder="-6.200000"
              defaultValue={setting.lat ?? ""}
            />
          </label>
          <label>
            Titik toko: longitude
            <input
              className="rincian-input"
              name="lng"
              type="number"
              step="any"
              min={-180}
              max={180}
              placeholder="106.816666"
              defaultValue={setting.lng ?? ""}
            />
          </label>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
          Ongkir kurir instan dihitung dari jarak titik toko ke titik lokasi pembeli: tarif dasar mencakup 3 km
          pertama, selebihnya per km (dibulatkan ke atas). Kosongkan tarif dasar atau per km untuk menonaktifkan
          kurir instan di web. Kurir tetap kamu pesan sendiri; web hanya menghitung ongkirnya.
        </p>
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
