import type { Metadata } from "next";
import { TopNav, Footer } from "@/components/site";
import { IsiKeranjang } from "./isi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Keranjang",
  description:
    "Barang yang mau kamu pesan dari warung sekitar. Satu pesanan untuk satu toko, dibayar lewat QRIS toko.",
};

export default function HalamanKeranjang() {
  return (
    <>
      <TopNav />
      <main className="section">
        <div className="container">
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Keranjang</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 560 }}>
            Satu pesanan berisi barang dari satu toko. Tambah atau kurangi jumlah dulu, lalu
            buat pesanan di bawah.
          </p>
          <div style={{ marginTop: 24 }}>
            <IsiKeranjang />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
