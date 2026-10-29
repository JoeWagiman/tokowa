import Link from "next/link";
import { LogoMark } from "./logo-mark";
import { PenandaKeranjang } from "./penanda-keranjang";
import { waLink } from "@/lib/api";

export function TopNav() {
  const wa = waLink("Halo Tokowa, aku mau tanya produk.");
  return (
    <header className="topbar">
      <div className="container topbar-in">
        <Link href="/" className="brand">
          <LogoMark />
          Tokowa
        </Link>
        <nav className="nav" aria-label="Utama">
          <Link href="/katalog">Katalog</Link>
          <Link href="/lacak">Lacak pesanan</Link>
          <Link href="/pesanan-saya">Pesanan saya</Link>
        </nav>
        <div className="topbar-kanan">
          <Link className="nav-masuk" href="/masuk">
            Masuk penjual
          </Link>
          <PenandaKeranjang />
          {wa ? (
            <a className="btn" href={wa} target="_blank" rel="noreferrer">
              Chat WhatsApp
            </a>
          ) : (
            <button className="btn" disabled title="Nomor WhatsApp belum diatur">
              Chat WhatsApp
            </button>
          )}
        </div>
      </div>
      <nav className="nav-mobile" aria-label="Menu">
        <Link href="/katalog">Katalog</Link>
        <Link href="/lacak">Lacak</Link>
        <Link href="/pesanan-saya">Pesanan saya</Link>
        <Link href="/masuk">Masuk penjual</Link>
        <Link href="/daftar-akun">Daftar jadi penjual</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand">
              <LogoMark />
              Tokowa
            </Link>
            <p className="footer-desk">
              Belanja lewat WhatsApp, terkirim dari warung tetangga. Satu nomor untuk
              semua warung di sekitar.
            </p>
          </div>
          <nav aria-label="Belanja">
            <h3>Belanja</h3>
            <Link href="/katalog">Katalog</Link>
            <Link href="/lacak">Lacak pesanan</Link>
            <Link href="/pesanan-saya">Pesanan saya</Link>
            <Link href="/keranjang">Keranjang</Link>
          </nav>
          <nav aria-label="Penjual">
            <h3>Penjual</h3>
            <Link href="/masuk">Masuk penjual</Link>
            <Link href="/daftar-akun">Daftar jadi penjual</Link>
            <Link href="/toko-saya">Toko saya</Link>
          </nav>
        </div>
        <div className="footer-bawah">
          <span>© 2026 Tokowa</span>
          <span>Warung sekitar, dikirim tetangga sendiri.</span>
        </div>
      </div>
    </footer>
  );
}
