"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rp } from "@/lib/format";

type Mode = "self_pickup" | "seller_delivery" | "courier_instant";

const PILIHAN: { nilai: Mode; label: string }[] = [
  { nilai: "self_pickup", label: "Ambil di toko" },
  { nilai: "seller_delivery", label: "Diantar toko" },
  { nilai: "courier_instant", label: "Kurir instan" },
];

type Kutipan = {
  subtotal: number;
  ongkir: number | null;
  total: number | null;
  catatan: string | null;
};

export function FormPesan({
  produkId,
  agentId,
  nama,
  stok,
}: {
  produkId: string;
  agentId: string;
  nama: string;
  stok: number;
}) {
  const router = useRouter();
  const habis = stok <= 0;

  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<Mode>("self_pickup");
  const [pelanggan, setPelanggan] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kutipan, setKutipan] = useState<Kutipan | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galatKutipan, setGalatKutipan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [kunci] = useState(() => `web-${produkId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (habis) return;
    let batal = false;
    const t = setTimeout(async () => {
      setMemuat(true);
      try {
        const res = await fetch("/api/pesan/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, items: [{ produkId, qty }], mode }),
        });
        const body = await res.json().catch(() => null);
        if (batal) return;
        if (!res.ok) {
          setGalatKutipan(body?.error?.message ?? "Tidak bisa menghitung total.");
          setKutipan(null);
        } else {
          setGalatKutipan(null);
          setKutipan(body.data as Kutipan);
        }
      } catch {
        if (!batal) {
          setGalatKutipan("Masalah ke server. Coba lagi nanti.");
          setKutipan(null);
        }
      } finally {
        if (!batal) setMemuat(false);
      }
    }, 250);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [agentId, produkId, qty, mode, habis]);

  async function buatPesanan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan(null);
    const digit = pelanggan.replace(/\D/g, "");
    if (digit.length < 9 || digit.length > 15) {
      setPesan("Nomor WhatsApp belum benar. Contoh: 081234567890.");
      return;
    }
    if (mode === "seller_delivery" && alamat.trim().length < 5) {
      setPesan("Isi alamat pengiriman dulu, minimal 5 karakter.");
      return;
    }
    setSibuk(true);
    try {
      const res = await fetch("/api/pesan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, items: [{ produkId, qty }], mode, pelanggan, alamat, idempotencyKey: kunci }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPesan(body?.error?.message ?? "Pesanan gagal dibuat.");
        return;
      }
      router.push(`/lacak?kode=${encodeURIComponent(body.data.kode)}&hp=${digit.slice(-4)}`);
    } catch {
      setPesan("Masalah ke server. Coba lagi nanti.");
    } finally {
      setSibuk(false);
    }
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

  const total = kutipan?.total ?? null;
  const bisaKirim = !sibuk && !memuat && total !== null;

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
        {PILIHAN.map((p) => (
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

      {mode === "seller_delivery" && (
        <label>
          Alamat pengiriman
          <textarea
            className="rincian-input"
            rows={3}
            maxLength={300}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Jalan, nomor rumah, patokan"
          />
        </label>
      )}

      <div className="ringkas-total">
        {galatKutipan && <p style={{ color: "var(--danger-ink)" }}>{galatKutipan}</p>}
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
        {!kutipan && !galatKutipan && <p style={{ color: "var(--muted)" }}>Menghitung total…</p>}
      </div>

      <button className="btn" type="submit" disabled={!bisaKirim}>
        {sibuk ? "Membuat pesanan…" : "Buat pesanan"}
      </button>
      <p className="cta-note">Bayar dengan QRIS toko setelah pesanan dibuat. Kode pesanan muncul di halaman lacak.</p>
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
