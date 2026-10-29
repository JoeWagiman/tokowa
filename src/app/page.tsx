import Link from "next/link";
import { TopNav, Footer } from "@/components/site";
import { DemoChat } from "@/components/demo-chat";
import { Ungkap } from "@/components/ungkap";
import { waLink } from "@/lib/api";

export const dynamic = "force-dynamic";

const daftarPita = [
  "Beras",
  "Minyak goreng",
  "Telur",
  "Gula pasir",
  "Kopi",
  "Mie instan",
  "Gas LPG",
  "Air galon",
  "Sabun cuci",
  "Bumbu dapur",
  "Susu",
  "Roti",
];

const contoh = [
  {
    tanya: "Beras 5 kg sama minyak 2 liter, ada?",
    jawab: "Ketemu di warung 1,2 km darimu. Balas YA untuk pesan.",
  },
  {
    tanya: "KURIR",
    jawab: "Ongkir dihitung dari jarak toko. Total diperbarui sebelum kamu bayar.",
  },
  {
    tanya: "Di mana pesananku?",
    jawab: "Sudah dibayar dan disiapkan toko. Lacak dari kode pesananmu kapan saja.",
  },
];

const caraTerima = [
  {
    nama: "Kurir instan",
    isi: "Ongkir dihitung dari jarak titikmu ke toko. Cocok untuk yang buru-buru.",
  },
  {
    nama: "Diantar toko",
    isi: "Tarif tetap dari toko. Pilih ini kalau tokonya memang mengantar.",
  },
  {
    nama: "Ambil sendiri",
    isi: "Gratis ongkir. Datang ke toko dan bawa pulang belanjaanmu.",
  },
];

const faq = [
  {
    tanya: "Apakah harus install aplikasi?",
    jawab:
      "Tidak. Semua lewat WhatsApp yang sudah ada di HP-mu: chat untuk belanja, web tokowa.app untuk katalog dan lacak pesanan.",
  },
  {
    tanya: "Bagaimana cara membayar?",
    jawab:
      "Bayar ke QRIS milik toko, lalu tandai Sudah bayar di halaman lacak (boleh lampirkan bukti). Toko memeriksa mutasinya sebelum pesanan dikirim.",
  },
  {
    tanya: "Bagaimana melacak pesanan?",
    jawab:
      "Buka halaman Lacak pesanan dengan kode pesanan dan 4 angka terakhir nomor WhatsApp-mu. Statusnya diperbarui setiap ada perubahan.",
  },
  {
    tanya: "Bagaimana kalau barang bermasalah?",
    jawab:
      "Ajukan retur langsung dari halaman lacak selama masa retur toko. Kalau retur ditolak atau masanya lewat, buka sengketa dan admin Tokowa menengahi.",
  },
  {
    tanya: "Untuk apa nomor WhatsApp saya dipakai?",
    jawab:
      "Hanya untuk memproses pesanan: konfirmasi, kabar status, dan verifikasi saat melacak. Tidak untuk yang lain.",
  },
];

export default function Landing() {
  const wa = waLink("Halo Tokowa, aku mau belanja.");

  return (
    <>
      <TopNav />
      <main>
        <section className="hero">
          <div className="container">
            <Ungkap>
              <div className="hero-tengah">
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
            </Ungkap>

            <DemoChat />
          </div>
        </section>

        <section className="pita-bungkus" aria-label="Contoh kebutuhan yang bisa dicari">
          <div className="pita" aria-hidden="true">
            <div className="pita-dalam">
              {[...daftarPita, ...daftarPita].map((x, i) => (
                <span key={`${x}-${i}`} className="pita-chip">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="kepala-section">
              <h2>Satu chat untuk semua kebutuhan</h2>
              <p>
                Contoh percakapan nyata yang bisa kamu lakukan. Tidak perlu hafal
                perintah; tulis saja seperti chat biasa.
              </p>
            </div>
            <div className="umpan">
              {contoh.map((c, i) => (
                <Ungkap key={c.tanya} jeda={i * 60}>
                  <article className="umpan-kartu">
                    <p className="umpan-tanya">{c.tanya}</p>
                    <p className="umpan-jawab">{c.jawab}</p>
                  </article>
                </Ungkap>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="kepala-section">
              <h2>Pilih cara terima</h2>
              <p>
                Tiga pilihan di setiap pesanan. Ongkir selalu dihitung di depan,
                sebelum kamu bayar.
              </p>
            </div>
            <div className="terima-grid">
              {caraTerima.map((c, i) => (
                <Ungkap key={c.nama} jeda={i * 60}>
                  <article className="kartu terima-kartu">
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{c.nama}</h3>
                    <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>{c.isi}</p>
                  </article>
                </Ungkap>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="kepala-section">
              <h2>Pertanyaan yang sering masuk</h2>
            </div>
            <div className="faq">
              {faq.map((f) => (
                <details key={f.tanya} className="faq-item">
                  <summary>{f.tanya}</summary>
                  <p>{f.jawab}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta-akhir">
              <h2>Tokowa belum dibuka umum</h2>
              <p>
                Pendaftaran penjual masih bertahap. Gabung waitlist dan kami
                menghubungimu lewat WhatsApp saat giliranmu tiba.
              </p>
              <div className="hero-cta">
                <Link className="btn" href="/daftar-akun">
                  Gabung waitlist
                </Link>
                <Link className="btn btn-ghost" href="/katalog">
                  Lihat katalog dulu
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
