"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { rp } from "@/lib/format";
import { tambahKeranjang } from "@/lib/keranjang";
import {
  type ModeKirim,
  PILIHAN_MODE,
  kirimPesanan,
  kunciIdempotensi,
  useKutipan,
  useLokasiPembeli,
  validasiPesanan,
} from "@/lib/pesan-klien";
import { BlokLokasi } from "@/components/blok-lokasi";

export function FormPesan({
  produkId,
  agentId,
  nama,
  stok,
  toko,
  harga,
  satuan,
}: {
  produkId: string;
  agentId: string;
  nama: string;
  stok: number;
  toko: string;
  harga: number;
  satuan: string;
}) {
  const router = useRouter();
  const habis = stok <= 0;

  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<ModeKirim>("self_pickup");
  const [pelanggan, setPelanggan] = useState("");
  const [alamat, setAlamat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [pesanKeranjang, setPesanKeranjang] = useState<string | null>(null);
  const [kunci] = useState(() => kunciIdempotensi(produkId));
  const { lokasi, status: statusLokasi, minta: mintaLokasi } = useLokasiPembeli();

  const { kutipan, memuat, galat } = useKutipan(
    agentId,
    habis ? [] : [{ produkId, qty }],
    mode,
    mode === "courier_instant" ? lokasi : null
  );

  function keKeranjang() {
    const hasil = tambahKeranjang({ produkId, agentId, toko, nama, harga, satuan, stok }, qty);
    if (!hasil.ok) {
      setPesanKeranjang(
        `Keranjangmu masih berisi barang dari ${hasil.toko}. Satu pesanan hanya untuk satu toko: selesaikan atau kosongkan keranjang dulu.`
      );
      return;
    }
    setPesanKeranjang(`Masuk keranjang (${hasil.jumlah} barang).`);
  }

  async function buatPesanan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan(null);
    const salah = validasiPesanan(pelanggan, mode, alamat, lokasi);
    if (salah) {
      setPesan(salah);
      return;
    }
    setSibuk(true);
    const hasil = await kirimPesanan({
      agentId,
      items: [{ produkId, qty }],
      mode,
      pelanggan,
      alamat,
      ...(mode === "courier_instant" && lokasi ? { lat: lokasi.lat, lng: lokasi.lng } : {}),
      idempotencyKey: kunci,
    });
    setSibuk(false);
    if (!hasil.ok) {
      setPesan(hasil.pesan);
      return;
    }
    const digit = pelanggan.replace(/\D/g, "");
    router.push(`/lacak?kode=${encodeURIComponent(hasil.kode)}&hp=${digit.slice(-4)}`);
  }

  if (habis) {
    return (
      <div className="pesan-box">
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Stok habis</h2>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          {nama} sedang tidak tersedia. Tanya lewat WhatsApp untuk kabar stok berikutnya.
        </p>
      </div>
    );
  }

  const bisaKirim = !sibuk && !memuat && kutipan?.total != null;

  return (
    <form className="pesan-box" onSubmit={buatPesanan}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Pesan dari web</h2>
      <div className="baris-form">
        <label>
          Jumlah
          <input
            className="rincian-input"
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          />
        </label>
        <label>
          Nomor WhatsApp
          <input
            className="rincian-input"
            type="tel"
            inputMode="tel"
            placeholder="081234567890"
            value={pelanggan}
            onChange={(e) => setPelanggan(e.target.value)}
            maxLength={20}
          />
        </label>
      </div>

      <fieldset className="pilihan-kirim">
        <legend>Cara terima</legend>
        {PILIHAN_MODE.map((p) => (
          <label key={p.nilai} className={mode === p.nilai ? "pill aktif" : "pill"}>
            <input
              type="radio"
              name="mode"
              value={p.nilai}
              checked={mode === p.nilai}
              onChange={() => setMode(p.nilai)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      {(mode === "seller_delivery" || mode === "courier_instant") && (
        <label>
          Alamat pengiriman
          <textarea
            className="rincian-input"
            rows={3}
            maxLength={300}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder={
              mode === "courier_instant" ? "Jalan, nomor rumah, patokan untuk kurir" : "Jalan, nomor rumah, patokan"
            }
          />
        </label>
      )}

      {mode === "courier_instant" && (
        <BlokLokasi lokasi={lokasi} status={statusLokasi} onMinta={mintaLokasi} />
      )}

      <div className="ringkas-total">
        {galat && <p style={{ color: "var(--danger-ink)" }}>{galat}</p>}
        {kutipan && (
          <>
            <div className="baris-total">
              <span>Subtotal</span>
              <span>{rp(kutipan.subtotal)}</span>
            </div>
            <div className="baris-total">
              <span>Ongkir</span>
              <span>{kutipan.ongkir === null ? "belum bisa dihitung" : rp(kutipan.ongkir)}</span>
            </div>
            {kutipan.catatan && <p style={{ color: "var(--muted)", fontSize: 13 }}>{kutipan.catatan}</p>}
            <div className="baris-total is-besar">
              <span>Total</span>
              <span>{kutipan.total === null ? "lewat WhatsApp" : rp(kutipan.total)}</span>
            </div>
          </>
        )}
        {!kutipan && !galat && <p style={{ color: "var(--muted)" }}>Menghitung total…</p>}
      </div>

      <button className="btn" type="submit" disabled={!bisaKirim}>
        {sibuk ? "Membuat pesanan…" : "Buat pesanan"}
      </button>
      <p className="cta-note">
        Bayar dengan QRIS toko setelah pesanan dibuat. Kode pesanan muncul di halaman lacak.
      </p>

      <button className="btn btn-ghost" type="button" onClick={keKeranjang}>
        Tambah ke keranjang
      </button>
      {pesanKeranjang && (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          {pesanKeranjang}{" "}
          <Link href="/keranjang" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
            Lihat keranjang
          </Link>
        </p>
      )}

      {pesan && (
        <p
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 14,
            background: "var(--danger-soft)",
            color: "var(--danger-ink)",
          }}
        >
          {pesan}
        </p>
      )}
    </form>
  );
}
