"use client";

import { useEffect, useState } from "react";
import { rp } from "@/lib/format";
import type { LacakPesanan } from "@/lib/tipe";

const chipStatus: Record<string, string> = {
  tunggu_bayar: "chip chip-warn",
  tunggu_verifikasi: "chip chip-warn",
  paid: "chip chip-ok",
  kirim: "chip chip-ok",
  selesai: "chip chip-muted",
  batal: "chip chip-muted",
};

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const labelKirim: Record<string, string> = {
  courier_instant: "Kurir instan",
  seller_delivery: "Diantar toko",
  self_pickup: "Ambil di toko",
};

export function FormLacak({ kodeAwal, hpAwal }: { kodeAwal: string; hpAwal: string }) {
  const [kode, setKode] = useState(kodeAwal);
  const [hp, setHp] = useState(hpAwal);
  const [muat, setMuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<LacakPesanan | null>(null);

  async function cari(kodeV: string, hpV: string) {
    setMuat(true);
    setGalat(null);
    setHasil(null);
    try {
      const res = await fetch(
        `/api/lacak?kode=${encodeURIComponent(kodeV.trim())}&hp=${encodeURIComponent(hpV.trim())}`,
        { cache: "no-store" }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGalat(body?.error?.message ?? "Tidak bisa memuat pesanan. Coba lagi.");
        return;
      }
      setHasil(body.data as LacakPesanan);
    } catch {
      setGalat("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setMuat(false);
    }
  }

  useEffect(() => {
    if (kodeAwal && hpAwal.length === 4) void cari(kodeAwal, hpAwal);
  }, [kodeAwal, hpAwal]);

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    void cari(kode, hp);
  }

  function ulangi() {
    setHasil(null);
    setGalat(null);
    setHp("");
  }

  return (
    <>
      <form className="lacak-form" onSubmit={kirim}>
        <label htmlFor="kode">Kode pesanan</label>
        <input
          id="kode"
          name="kode"
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          placeholder="Contoh: V1GDOR"
          autoComplete="off"
          required
        />
        <p className="lacak-hint">Kode ada di pesan WhatsApp, 6 huruf dan angka terakhir.</p>

        <label htmlFor="hp">4 angka terakhir nomor WhatsApp</label>
        <input
          id="hp"
          name="hp"
          value={hp}
          onChange={(e) => setHp(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          placeholder="6789"
          autoComplete="off"
          required
        />

        <button className="btn" type="submit" disabled={muat} aria-busy={muat}>
          {muat ? "Mencari" : "Lacak pesanan"}
        </button>
      </form>

      <div aria-live="polite" style={{ marginTop: 24 }}>
        {galat && (
          <div className="galat">
            <h3>Pesanan tidak ditemukan</h3>
            <p>{galat}</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Cek lagi kode pesanan dan 4 angka terakhir nomor WhatsApp yang dipakai saat
              memesan.
            </p>
          </div>
        )}

        {hasil && <KartuLacak p={hasil} onUlangi={ulangi} />}
      </div>
    </>
  );
}

function KartuLacak({ p, onUlangi }: { p: LacakPesanan; onUlangi: () => void }) {
  return (
    <section className="kartu" aria-label={`Pesanan ${p.kode}`}>
      <div className="lacak-head">
        <div>
          <p className="lacak-kode">Pesanan #{p.kode}</p>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{p.toko}</h2>
        </div>
        <span className={chipStatus[p.status] ?? "chip chip-muted"}>{p.statusLabel}</span>
      </div>

      {p.langkah.length > 0 && (
        <ol className="jejak">
          {p.langkah.map((l) => (
            <li key={l.status} className={l.keadaan}>
              <span className="titik" aria-hidden="true" />
              <span>{l.label}</span>
            </li>
          ))}
        </ol>
      )}

      {p.status === "batal" && (
        <p style={{ color: "var(--muted)", marginTop: 12 }}>
          Pesanan ini dibatalkan. Hubungi toko lewat WhatsApp kalau perlu penjelasan.
        </p>
      )}

      {p.bayar && p.status === "tunggu_bayar" && (
        <div className="lacak-bayar">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cara bayar</h3>
          {p.bayar.qrisUrl ? (
            <>
              <img src={p.bayar.qrisUrl} alt={p.bayar.qrisNama ?? "QRIS toko"} style={{ maxWidth: 220 }} />
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {p.bayar.qrisNama ?? "QRIS toko"}. Kirim bukti bayar lewat WhatsApp setelah
                membayar.
              </p>
            </>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Toko belum memasang gambar QRIS di halaman ini. Minta cara pembayaran lewat
              WhatsApp.
            </p>
          )}
        </div>
      )}

      {p.bayar && p.status === "tunggu_verifikasi" && (
        <p style={{ color: "var(--muted)", marginTop: 16 }}>
          Bukti bayarmu sedang diperiksa toko. Status akan berubah setelah toko memverifikasi.
        </p>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>Rincian</h3>
      <table className="tabel">
        <thead>
          <tr>
            <th>Barang</th>
            <th>Jumlah</th>
            <th>Harga</th>
          </tr>
        </thead>
        <tbody>
          {p.items.map((i, idx) => (
            <tr key={`${i.nama}-${idx}`}>
              <td>{i.nama}</td>
              <td>
                {i.qty} {i.satuan}
              </td>
              <td>{rp(i.harga)}</td>
            </tr>
          ))}
          {p.pengiriman && (
            <tr>
              <td>Ongkir ({labelKirim[p.pengiriman.mode] ?? p.pengiriman.mode})</td>
              <td />
              <td>{p.pengiriman.ongkir > 0 ? rp(p.pengiriman.ongkir) : "gratis"}</td>
            </tr>
          )}
          <tr>
            <td style={{ fontWeight: 700 }}>Total</td>
            <td />
            <td style={{ fontWeight: 700 }}>{rp(p.total)}</td>
          </tr>
        </tbody>
      </table>

      {p.pengiriman?.alamat && (
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>
          {p.pengiriman.mode === "self_pickup" ? "Catatan ambil di toko" : "Dikirim ke"}: {p.pengiriman.alamat}
        </p>
      )}

      <dl className="lacak-waktu">
        <div>
          <dt>Dibuat</dt>
          <dd>{waktu(p.dibuatAt)}</dd>
        </div>
        <div>
          <dt>Pembaruan terakhir</dt>
          <dd>{waktu(p.diperbaruiAt)}</dd>
        </div>
        {p.pelangganMask && (
          <div>
            <dt>Nomor WhatsApp</dt>
            <dd>{p.pelangganMask}</dd>
          </div>
        )}
      </dl>

      <div className="baris-aksi">
        <button className="btn btn-ghost" type="button" onClick={onUlangi}>
          Lacak pesanan lain
        </button>
      </div>
    </section>
  );
}
