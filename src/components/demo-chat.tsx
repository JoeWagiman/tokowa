"use client";

import { useEffect, useRef, useState } from "react";

type Langkah =
  | { jenis: "ketik"; teks: string; tahan: number }
  | { jenis: "pesan"; dari: "pembeli" | "agen"; teks: string; tahan: number }
  | { jenis: "mengetik"; tahan: number }
  | { jenis: "kartu"; tahan: number };

const NASKAH: Langkah[] = [
  { jenis: "ketik", teks: "Beras 5 kg sama minyak 2 liter, ada?", tahan: 700 },
  { jenis: "pesan", dari: "pembeli", teks: "Beras 5 kg sama minyak 2 liter, ada?", tahan: 500 },
  { jenis: "mengetik", tahan: 900 },
  {
    jenis: "pesan",
    dari: "agen",
    teks: "Ketemu di warung 1,2 km darimu, stoknya ada. Balas YA untuk pesan, atau KURIR untuk kurir instan.",
    tahan: 1400,
  },
  { jenis: "pesan", dari: "pembeli", teks: "KURIR", tahan: 900 },
  { jenis: "mengetik", tahan: 800 },
  {
    jenis: "pesan",
    dari: "agen",
    teks: "Kurir instan dihitung dari jarak toko. Balas YA untuk lanjut bayar.",
    tahan: 1100,
  },
  { jenis: "pesan", dari: "pembeli", teks: "YA", tahan: 700 },
  { jenis: "kartu", tahan: 2600 },
];

export function DemoChat() {
  const wadahRef = useRef<HTMLDivElement>(null);
  const isiRef = useRef<HTMLDivElement>(null);
  const [jalan, setJalan] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [terketik, setTerketik] = useState("");

  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndeks(NASKAH.length);
      return;
    }
    const io = new IntersectionObserver(
      (masuk) => {
        for (const m of masuk) setJalan(m.intersectionRatio >= 0.35);
      },
      { threshold: [0, 0.35, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!jalan) return;
    const langkah = NASKAH[indeks];
    if (!langkah) {
      const t = setTimeout(() => {
        setIndeks(0);
        setTerketik("");
      }, 4000);
      return () => clearTimeout(t);
    }
    if (langkah.jenis === "ketik") {
      setTerketik("");
      let i = 0;
      const iv = setInterval(() => {
        i += 1;
        setTerketik(langkah.teks.slice(0, i));
        if (i >= langkah.teks.length) {
          clearInterval(iv);
          setTimeout(() => setIndeks((v) => v + 1), langkah.tahan);
        }
      }, 30);
      return () => clearInterval(iv);
    }
    const t = setTimeout(() => setIndeks((v) => v + 1), langkah.tahan);
    return () => clearTimeout(t);
  }, [jalan, indeks]);

  useEffect(() => {
    isiRef.current?.scrollTo({ top: isiRef.current.scrollHeight });
  }, [indeks, terketik]);

  return (
    <div ref={wadahRef} className="hp" role="img" aria-label="Contoh percakapan belanja: pembeli menanyakan beras dan minyak, agent mencarikan warung terdekat, pembeli memilih kurir lalu membalas YA, dan pesanan tercatat.">
      <div className="hp-bar">Tokowa</div>

      <div ref={isiRef} className="hp-isi" aria-hidden="true">
        {NASKAH.slice(0, indeks + 1).map((l, i) => {
          if (l.jenis === "pesan") {
            return (
              <div key={i} className={`gelembung ${l.dari} hp-masuk`}>
                {l.teks}
              </div>
            );
          }
          if (l.jenis === "mengetik" && i === indeks) {
            return (
              <div key={i} className="gelembung agen hp-masuk hp-titik">
                <span />
                <span />
                <span />
              </div>
            );
          }
          if (l.jenis === "kartu") {
            return (
              <div key={i} className="hp-kartu">
                <p className="hp-kartu-judul">Pesanan tercatat</p>
                <p className="hp-kartu-isi">
                  Bayar ke QRIS toko, lalu tandai Sudah bayar di halaman lacak.
                </p>
                <span className="hp-kartu-lencana">Menunggu pembayaran</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="hp-tulis" aria-hidden="true">
        <span className={terketik ? "hp-teks" : "hp-teks pudar"}>
          {terketik || "Tulis yang kamu cari…"}
        </span>
        <span className={`hp-kirim${terketik ? " nyala" : ""}`}>Kirim</span>
      </div>
    </div>
  );
}
