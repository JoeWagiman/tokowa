"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rp } from "@/lib/format";
import { type JejakPesanan, bacaRiwayat, kosongkanRiwayat } from "@/lib/riwayat";

const chipStatus: Record<string, string> = {
  tunggu_bayar: "chip chip-warn",
  tunggu_verifikasi: "chip chip-warn",
  paid: "chip chip-ok",
  kirim: "chip chip-ok",
  selesai: "chip chip-muted",
  batal: "chip chip-muted",
};

const formatWaktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function IsiPesananSaya() {
  const [daftar, setDaftar] = useState<JejakPesanan[] | null>(null);
  const [status, setStatus] = useState<Record<string, { label: string; kelas: string }>>({});

  useEffect(() => {
    const jejak = bacaRiwayat();
    setDaftar(jejak);
    if (jejak.length === 0) return;
    let batal = false;
    void (async () => {
      const hasil: Record<string, { label: string; kelas: string }> = {};
      for (const j of jejak) {
        try {
          const res = await fetch(`/api/lacak?kode=${encodeURIComponent(j.kode)}&hp=${encodeURIComponent(j.hp4)}`, {
            cache: "no-store",
          });
          const body = await res.json().catch(() => null);
          if (res.ok && body?.data?.status) {
            hasil[j.kode] = {
              label: body.data.statusLabel ?? body.data.status,
              kelas: chipStatus[body.data.status as string] ?? "chip chip-muted",
            };
          }
        } catch {
          hasil[j.kode] = { label: "Status belum termuat", kelas: "chip chip-muted" };
        }
        if (!batal) setStatus({ ...hasil });
      }
    })();
    return () => {
      batal = true;
    };
  }, []);

  if (daftar === null) {
    return <p style={{ color: "var(--muted)" }}>Memuat riwayat pesanan…</p>;
  }

  if (daftar.length === 0) {
    return (
      <div className="kosong">
        <h3>Belum ada pesanan dari perangkat ini.</h3>
        <p>
          Setelah membuat pesanan dari web, kodenya tersimpan di sini. Punya kode dari
          WhatsApp? Lacak langsung dengan kode itu.
        </p>
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

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {daftar.map((j) => (
        <article key={j.kode} className="kartu" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "14px 16px" }}>
          <div>
            <p style={{ fontWeight: 700 }}>
              {j.toko} <span style={{ color: "var(--muted)", fontWeight: 500 }}>#{j.kode}</span>
            </p>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              {formatWaktu(j.dibuatAt)} · {rp(j.total)}
            </p>
            <p style={{ marginTop: 6 }}>
              <span className={status[j.kode]?.kelas ?? "chip chip-muted"}>
                {status[j.kode]?.label ?? "Memeriksa status…"}
              </span>
            </p>
          </div>
          <Link className="btn btn-ghost" href={`/lacak?kode=${encodeURIComponent(j.kode)}&hp=${encodeURIComponent(j.hp4)}`}>
            Lacak
          </Link>
        </article>
      ))}
      <div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            if (window.confirm("Hapus semua riwayat pesanan di perangkat ini? Kode pesanan di WhatsApp tidak ikut terhapus.")) {
              kosongkanRiwayat();
              setDaftar([]);
              setStatus({});
            }
          }}
        >
          Bersihkan riwayat
        </button>
      </div>
    </div>
  );
}
