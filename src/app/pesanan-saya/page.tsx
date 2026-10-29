import { TopNav, Footer } from "@/components/site";
import { IsiPesananSaya } from "./isi";

export const metadata = { title: "Pesanan saya" };

export default function HalamanPesananSaya() {
  return (
    <>
      <TopNav />
      <main>
        <div className="container" style={{ padding: "28px 20px", maxWidth: 820 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Pesanan saya</h1>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Pesanan yang dibuat dari perangkat ini tersimpan di sini. Kalau ganti perangkat,
            pakai kode pesanan di halaman Lacak.
          </p>
          <IsiPesananSaya />
        </div>
      </main>
      <Footer />
    </>
  );
}
