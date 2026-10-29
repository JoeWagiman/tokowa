import Link from "next/link";
import { FormWaitlist } from "@/components/form-waitlist";

export const metadata = { title: "Gabung waitlist" };

export default function HalamanMasuk() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "min(380px, 100%)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, textAlign: "center" }}>Tokowa belum dibuka umum</h1>
        <p style={{ color: "var(--muted)", marginBottom: 20, textAlign: "center" }}>
          Pendaftaran penjual masih bertahap. Isi form ini, kami menghubungimu
          lewat WhatsApp saat giliranmu tiba.
        </p>
        <FormWaitlist />
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 14, textAlign: "center" }}>
          <Link href="/" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
            Kembali ke Tokowa
          </Link>
        </p>
      </div>
    </main>
  );
}
