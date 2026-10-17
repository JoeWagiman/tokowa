import Link from "next/link";
import { TopNav, Footer } from "@/components/site";
import { waLink } from "@/lib/api";

const langkah = [
  { b: "Kirim pesan", s: "Buka WhatsApp tokowa.app, tulis yang kamu cari." },
  { b: "Dibantu agent", s: "Agent mencocokkan permintaan ke warung terdekat." },
  { b: "Pilih cara terima", s: "Kurir instan, antar penjual, atau ambil sendiri." },
];

export default function Landing() {
  const wa = waLink("Halo Tokowa, aku mau belanja.");

  return (
    <>
      <TopNav />
      <main>
        <section className="hero">
          <div className="container">
            <h1>Belanja dari warung sekitar, cukup lewat WhatsApp.</h1>
            <p>
              Satu nomor untuk semua warung di sekitar. Agent memandu kamu dari
              cari barang sampai barang tiba, tanpa unduh aplikasi baru.
            </p>
            <div className="hero-cta">
              {wa ? (
                <a className="btn" href={wa} target="_blank" rel="noreferrer">
                  Chat di WhatsApp
                </a>
              ) : (
                <button className="btn" disabled title="Nomor WhatsApp belum diatur">
                  Chat di WhatsApp
                </button>
              )}
              <Link className="btn btn-ghost" href="/katalog">
                Lihat katalog
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Cara belanja</h2>
            <ul className="langkah">
              {langkah.map((l) => (
                <li key={l.b}>
                  <b>{l.b}</b>
                  <span>{l.s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
