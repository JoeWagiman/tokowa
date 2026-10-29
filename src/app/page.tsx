import Link from "next/link";
import { TopNav, Footer } from "@/components/site";
import { IlustrasiWarung } from "@/components/ilustrasi-warung";
import { waLink } from "@/lib/api";

export default function Landing() {
  const wa = waLink("Halo Tokowa, aku mau belanja.");

  return (
    <>
      <TopNav />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
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

            <IlustrasiWarung />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Cara belanja</h2>
            <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: "40em" }}>
              Semua lewat satu percakapan WhatsApp. Beginilah alurnya dari pesan
              pertama sampai barang dipilihkan.
            </p>
            <div className="alur">
              <div className="alur-baris pembeli">
                <div className="gelembung pembeli">Beras 5 kg sama minyak 2 liter, ada?</div>
                <p className="alur-ket">
                  <b>1 · Kirim pesan</b>
                  <span>Buka WhatsApp Tokowa, tulis yang kamu cari.</span>
                </p>
              </div>
              <div className="alur-baris agen">
                <div className="gelembung agen">
                  Ketemu warung terdekat yang stoknya ada. Balas YA untuk pesan, atau
                  KURIR untuk kurir instan.
                </div>
                <p className="alur-ket">
                  <b>2 · Dibantu agent</b>
                  <span>Agent mencocokkan permintaan ke warung terdekat.</span>
                </p>
              </div>
              <div className="alur-baris pembeli">
                <div className="gelembung pembeli">KURIR</div>
                <p className="alur-ket">
                  <b>3 · Pilih cara terima</b>
                  <span>Kurir instan, diantar penjual, atau ambil sendiri di toko.</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
