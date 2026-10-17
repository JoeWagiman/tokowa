import { TopNav, Footer } from "@/components/site";
import { FormLacak } from "./lacak-form";

export const metadata = { title: "Lacak pesanan" };

export default async function Lacak({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string; hp?: string }>;
}) {
  const { kode, hp } = await searchParams;

  return (
    <>
      <TopNav />
      <main className="section">
        <div className="container lacak-wrap">
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Lacak pesanan</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 560 }}>
            Masukkan kode pesanan dari chat WhatsApp dan 4 angka terakhir nomor yang kamu
            pakai saat memesan. Riwayat dan status tampil apa adanya dari toko.
          </p>
          <FormLacak kodeAwal={(kode ?? "").trim()} hpAwal={(hp ?? "").replace(/\D/g, "").slice(-4)} />
        </div>
      </main>
      <Footer />
    </>
  );
}
