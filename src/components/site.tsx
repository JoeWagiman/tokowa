import Link from "next/link";
import { LogoMark } from "./logo-mark";
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
        <nav className="nav">
          <Link href="/katalog">Katalog</Link>
          <Link href="/lacak">Lacak pesanan</Link>
        </nav>
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
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <span>Tokowa</span>
        <span>Belanja lewat WhatsApp, terkirim dari warung tetangga.</span>
      </div>
    </footer>
  );
}
