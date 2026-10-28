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

const ALASAN_RETUR = [
  { nilai: "rusak", label: "Barang rusak" },
  { nilai: "basi", label: "Barang basi atau kedaluwarsa" },
  { nilai: "salah", label: "Salah kirim barang" },
  { nilai: "tidak_sesuai", label: "Tidak sesuai pesanan" },
  { nilai: "berubah_pikiran", label: "Berubah pikiran" },
  { nilai: "lain", label: "Alasan lain" },
];

const labelOngkirRetur: Record<string, string> = {
  pembeli: "ongkir retur ditanggung pembeli",
  toko: "ongkir retur ditanggung toko",
  bagi_dua: "ongkir retur dibagi dua",
};

const chipRetur: Record<string, string> = {
  diajukan: "chip chip-warn",
  disetujui: "chip chip-warn",
  ditolak: "chip chip-muted",
  barang_diterima: "chip chip-ok",
  refund: "chip chip-ok",
  selesai: "chip chip-ok",
};

export function FormLacak({ kodeAwal, hpAwal }: { kodeAwal: string; hpAwal: string }) {
  const [kode, setKode] = useState(kodeAwal);
  const [hp, setHp] = useState(hpAwal);
  const [muat, setMuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<LacakPesanan | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

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
    setPesan(null);
    void cari(kode, hp);
  }

  function ulangi() {
    setHasil(null);
    setGalat(null);
    setPesan(null);
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

        {hasil && (
          <KartuLacak
            p={hasil}
            hp={hp}
            pesan={pesan}
            onPesan={setPesan}
            onSegarkan={() => void cari(kode, hp)}
            onUlangi={ulangi}
          />
        )}
      </div>
    </>
  );
}

function KartuLacak({
  p,
  hp,
  pesan,
  onPesan,
  onSegarkan,
  onUlangi,
}: {
  p: LacakPesanan;
  hp: string;
  pesan: string | null;
  onPesan: (pesan: string | null) => void;
  onSegarkan: () => void;
  onUlangi: () => void;
}) {
  const [kirim, setKirim] = useState(false);
  const [berkas, setBerkas] = useState<File | null>(null);
  const [galatBerkas, setGalatBerkas] = useState<string | null>(null);
  const [galatBayar, setGalatBayar] = useState<string | null>(null);
  const [tanyaBatal, setTanyaBatal] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);
  const [bukaRetur, setBukaRetur] = useState(false);
  const [alasan, setAlasan] = useState(ALASAN_RETUR[0].nilai);
  const [catatan, setCatatan] = useState("");

  async function minta(endpoint: string, isi: Record<string, unknown>) {
    setSibuk(true);
    setGalatAksi(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: p.id, hp, ...isi }),
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGalatAksi(body?.error?.message ?? "Permintaan tidak bisa diproses. Coba lagi.");
        return false;
      }
      onPesan(body?.data?.pesan ?? "Permintaan diteruskan ke toko.");
      onSegarkan();
      return true;
    } catch {
      setGalatAksi("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
      return false;
    } finally {
      setSibuk(false);
    }
  }

  async function batalkanPesanan() {
    const berhasil = await minta("/api/lacak/batal", {});
    if (berhasil) setTanyaBatal(false);
  }

  async function kirimRetur(e: React.FormEvent) {
    e.preventDefault();
    const berhasil = await minta("/api/lacak/retur", { alasan, catatan: catatan.trim() || null });
    if (berhasil) {
      setBukaRetur(false);
      setCatatan("");
    }
  }

  async function tandaiSudahBayar() {
    setKirim(true);
    setGalatBayar(null);
    try {
      const res = await fetch("/api/lacak/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: p.id, hp }),
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGalatBayar(body?.error?.message ?? "Tidak bisa menandai pembayaran. Coba lagi.");
        return;
      }
      onPesan(body?.data?.pesan ?? "Konfirmasi diteruskan ke toko.");
      onSegarkan();
    } catch {
      setGalatBayar("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setKirim(false);
    }
  }

  async function kirimBukti() {
    if (!berkas) return;
    setKirim(true);
    setGalatBayar(null);
    try {
      const fd = new FormData();
      fd.append("kode", p.id);
      fd.append("hp", hp);
      fd.append("file", berkas);
      const res = await fetch("/api/lacak/bukti", { method: "POST", body: fd, cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGalatBayar(body?.error?.message ?? "Tidak bisa mengirim bukti. Coba lagi.");
        return;
      }
      onPesan(body?.data?.pesan ?? "Bukti terkirim ke toko.");
      setBerkas(null);
      onSegarkan();
    } catch {
      setGalatBayar("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setKirim(false);
    }
  }

  function pilihBerkas(f: File | null) {
    setGalatBerkas(null);
    if (f && f.size > 5 * 1024 * 1024) {
      setGalatBerkas("Ukuran bukti melebihi 5 MB. Kecilkan dulu (screenshot biasanya cukup).");
      setBerkas(null);
      return;
    }
    setBerkas(f);
  }

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

      {pesan && (
        <p className="pesan-box" style={{ display: "block" }}>
          {pesan}
        </p>
      )}

      {p.bayar && p.status === "tunggu_bayar" && (
        <div className="lacak-bayar">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cara bayar</h3>
          {p.bayar.qrisUrl ? (
            <>
              <img src={p.bayar.qrisUrl} alt={p.bayar.qrisNama ?? "QRIS toko"} style={{ maxWidth: 220 }} />
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {p.bayar.qrisNama ?? "QRIS toko"}. Setelah membayar, lampirkan bukti di
                bawah atau kirim lewat WhatsApp.
              </p>
            </>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Toko belum memasang gambar QRIS di halaman ini. Minta cara pembayaran lewat
              WhatsApp.
            </p>
          )}
          <div style={{ marginTop: 12 }}>
            <label htmlFor="bukti-bayar" style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Lampirkan bukti bayar (opsional)
            </label>
            <input
              id="bukti-bayar"
              className="rincian-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => pilihBerkas(e.target.files?.[0] ?? null)}
            />
            {galatBerkas && (
              <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 6 }} role="alert">
                {galatBerkas}
              </p>
            )}
            <div style={{ marginTop: 10 }}>
              <button
                className="btn"
                type="button"
                onClick={() => void (berkas ? kirimBukti() : tandaiSudahBayar())}
                disabled={kirim}
                aria-busy={kirim}
              >
                {kirim ? "Mengirim" : berkas ? "Kirim bukti & tandai sudah bayar" : "Saya sudah bayar"}
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>
              Tandai di sini supaya toko mengecek mutasinya. Bukti boleh dilampirkan di sini
              atau dikirim lewat WhatsApp.
            </p>
            {galatBayar && (
              <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 8 }} role="alert">
                {galatBayar}
              </p>
            )}
          </div>
        </div>
      )}

      {p.bayar && p.status === "tunggu_verifikasi" && (
        <p style={{ color: "var(--muted)", marginTop: 16 }}>
          Pembayaranmu sedang diperiksa toko. Status akan berubah setelah toko memverifikasi.
        </p>
      )}

      {galatAksi && (
        <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 12 }} role="alert">
          {galatAksi}
        </p>
      )}

      {p.bisaBatal && (
        <div className="lacak-aksi">
          {!tanyaBatal ? (
            <button className="btn btn-ghost" type="button" onClick={() => setTanyaBatal(true)}>
              Batalkan pesanan
            </button>
          ) : (
            <div>
              <p style={{ fontWeight: 600 }}>
                Yakin batalkan pesanan #{p.kode}? Barang tidak jadi dipesan.
              </p>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Belum ada uang yang berpindah, jadi tidak ada refund yang perlu diurus.
              </p>
              <div className="baris-aksi">
                <button className="btn" type="button" onClick={() => void batalkanPesanan()} disabled={sibuk} aria-busy={sibuk}>
                  {sibuk ? "Membatalkan" : "Ya, batalkan"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setTanyaBatal(false)} disabled={sibuk}>
                  Jangan, simpan pesanan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {p.retur && (
        <div className="lacak-retur">
          <div className="lacak-head">
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Retur {p.retur.kode}</h3>
            <span className={chipRetur[p.retur.status] ?? "chip chip-muted"}>{p.retur.statusLabel}</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Alasan: {p.retur.alasanLabel}</p>
          {p.retur.refundTotal > 0 && (
            <p style={{ fontSize: 14, marginTop: 4 }}>
              Refund tercatat: <strong>{rp(p.retur.refundTotal)}</strong>
              {p.retur.refundCatatan ? ` (${p.retur.refundCatatan})` : ""}
            </p>
          )}
          {p.retur.status === "disetujui" && (
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
              Kirim barang kembali ke toko. Koordinasi lewat WhatsApp supaya alamat dan
              ongkirnya jelas ({labelOngkirRetur[p.ongkirRetur] ?? p.ongkirRetur}).
            </p>
          )}
          {p.retur.status === "ditolak" && (
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
              Tanya alasan penolakan lewat WhatsApp. Kalau tidak sepakat, toko bisa
              meninjau ulang.
            </p>
          )}
        </div>
      )}

      {p.bisaRetur && !bukaRetur && (
        <div className="lacak-aksi">
          <button className="btn btn-ghost" type="button" onClick={() => setBukaRetur(true)}>
            Ajukan retur
          </button>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Batas pengajuan {p.jendelaReturHari} hari sejak pesanan dibuat.
          </p>
        </div>
      )}

      {p.bisaRetur && bukaRetur && (
        <form className="lacak-retur" onSubmit={kirimRetur}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Ajukan retur</h3>
          <label htmlFor="alasan-retur">Alasan</label>
          <select
            id="alasan-retur"
            name="alasan"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
          >
            {ALASAN_RETUR.map((a) => (
              <option key={a.nilai} value={a.nilai}>
                {a.label}
              </option>
            ))}
          </select>
          <label htmlFor="catatan-retur">Catatan untuk toko (opsional)</label>
          <textarea
            id="catatan-retur"
            name="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Contoh: kemasan penyok, isi bocor"
          />
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Toko memutuskan pengajuan ini. {labelOngkirRetur[p.ongkirRetur] ?? p.ongkirRetur}.
          </p>
          <div className="baris-aksi">
            <button className="btn" type="submit" disabled={sibuk} aria-busy={sibuk}>
              {sibuk ? "Mengirim" : "Kirim pengajuan"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setBukaRetur(false)} disabled={sibuk}>
              Urungkan
            </button>
          </div>
        </form>
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
