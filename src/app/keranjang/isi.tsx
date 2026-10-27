"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rp } from "@/lib/format";
import {
  type ItemKeranjang,
  bacaKeranjang,
  hapusKeranjang,
  kosongkanKeranjang,
  MAKS_QTY_KERANJANG,
  ubahQtyKeranjang,
} from "@/lib/keranjang";
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

export function IsiKeranjang() {
  const router = useRouter();
  const [items, setItems] = useState<ItemKeranjang[] | null>(null);
  const [mode, setMode] = useState<ModeKirim>("self_pickup");
  const [pelanggan, setPelanggan] = useState("");
  const [alamat, setAlamat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [kunci] = useState(() => kunciIdempotensi("keranjang"));
  const { lokasi, status: statusLokasi, minta: mintaLokasi } = useLokasiPembeli();

  useEffect(() => {
    setItems(bacaKeranjang());
  }, []);

  const daftar = items ?? [];
  const agentId = daftar[0]?.agentId ?? "";
  const toko = daftar[0]?.toko ?? "";
  const baris = daftar.map((x) => ({ produkId: x.produkId, qty: x.qty }));
  const { kutipan, memuat, galat } = useKutipan(agentId, baris, mode, mode === "courier_instant" ? lokasi : null);

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
      items: baris,
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
    kosongkanKeranjang();
    const digit = pelanggan.replace(/\D/g, "");
    router.push(`/lacak?kode=${encodeURIComponent(hasil.kode)}&hp=${digit.slice(-4)}`);
  }

  if (items === null) {
    return <p style={{ color: "var(--muted)" }}>Memuat keranjang…</p>;
  }

  if (daftar.length === 0) {
    return (
      <div className="kosong">
        <h3>Keranjang masih kosong</h3>
        <p>Pilih barang di katalog, lalu tekan Tambah ke keranjang.</p>
        <div className="baris-aksi" style={{ justifyContent: "center", marginTop: 16 }}>
          <Link className="btn" href="/katalog">
            Lihat katalog
          </Link>
          <Link className="btn btn-ghost" href="/lacak">
            Lacak pesanan
          </Link>
        </div>
      </div>
    );
  }

  const bisaKirim = !sibuk && !memuat && kutipan?.total != null && baris.length <= 20;

  return (
    <div className="keranjang-wrap">
      <section className="kartu" aria-label="Isi keranjang">
        <div className="toko-head">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{toko}</h2>
          <span className="keranjang-toko">Satu pesanan untuk satu toko</span>
        </div>

        {daftar.map((x) => (
          <div className="keranjang-baris" key={x.produkId}>
            <div>
              <p className="keranjang-nama">{x.nama}</p>
              <p className="keranjang-toko">
                {rp(x.harga)} / {x.satuan} · stok {x.stok}
              </p>
            </div>
            <div className="keranjang-aksi">
              <label style={{ display: "grid", gap: 4 }}>
                <span className="keranjang-toko">Jumlah</span>
                <input
                  className="rincian-input"
                  type="number"
                  min={1}
                  max={Math.max(1, Math.min(MAKS_QTY_KERANJANG, x.stok))}
                  value={x.qty}
                  onChange={(e) => setItems(ubahQtyKeranjang(x.produkId, Number(e.target.value) || 1))}
                />
              </label>
              <button
                type="button"
                className="keranjang-hapus"
                onClick={() => setItems(hapusKeranjang(x.produkId))}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        <div className="baris-aksi" style={{ marginTop: 12, justifyContent: "flex-start" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              kosongkanKeranjang();
              setItems([]);
            }}
          >
            Kosongkan keranjang
          </button>
        </div>
      </section>

      <form className="pesan-box" onSubmit={buatPesanan}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Pesan dari web</h2>

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
    </div>
  );
}
