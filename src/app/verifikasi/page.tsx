import { redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status verifikasi" };

type Kyc = { status: string; catatan: string | null; decidedAt: string | null; updatedAt: string } | null;

const isi: Record<string, { judul: string; chip: string; teks: React.ReactNode }> = {
  menunggu: {
    judul: "Verifikasi sedang diproses",
    chip: "chip chip-warn",
    teks: (
      <>
        Tim memeriksa dokumenmu .
      </>
    ),
  },
  diterima: {
    judul: "Tokomu sudah terverifikasi",
    chip: "chip chip-ok",
    teks: (
      <>
        Toko tampil di katalog umum Tokowa. Buka <a href="/toko-saya" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>toko</a>{" "}
        untuk kelola pesanan dan produk.
      </>
    ),
  },
};

export default async function HalamanVerifikasi() {
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let kyc: Kyc = null;
  let galat: ApiError | null = null;
  try {
    kyc = await obrool<Kyc>("/api/v1/seller/kyc", { token });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) redirect("/masuk");
    galat = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main>
        <div className="container" style={{ padding: "28px 20px", maxWidth: 680 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Status verifikasi</h1>

          {galat && (
            <div className="galat">
              <h3>Status tidak bisa dimuat</h3>
              <p>{galat.message}</p>
              <a className="btn btn-ghost" href="/verifikasi">
                Coba lagi
              </a>
            </div>
          )}

          {!galat && !kyc && (
            <div className="kosong">
              <h3>Belum mengajukan verifikasi.</h3>
              <p>
                Lengkapi data untuk muncul di katalog umum.
                <br />
                <a className="btn" href="/daftar" style={{ marginTop: 14 }}>
                  Mulai verifikasi
                </a>
              </p>
            </div>
          )}

          {!galat && kyc && kyc.status !== "ditolak" && (
            <section className="kartu" style={{ textAlign: "center", padding: "36px 24px" }}>
              <span className={isi[kyc.status]?.chip ?? "chip chip-muted"}>
                {kyc.status === "diterima" ? "Terverifikasi" : "Menunggu verifikasi"}
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>{isi[kyc.status]?.judul}</h2>
              <p style={{ color: "var(--muted)", marginTop: 6 }}>{isi[kyc.status]?.teks}</p>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 14 }}>
                Terakhir diperbarui {new Date(kyc.updatedAt).toLocaleString("id-ID")}
              </p>
            </section>
          )}

          {!galat && kyc && kyc.status === "ditolak" && (
            <section className="kartu" style={{ textAlign: "center", padding: "36px 24px" }}>
              <span className="chip chip-muted">Ditolak</span>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>Pengajuan belum lolos</h2>
              <p style={{ color: "var(--muted)", marginTop: 6 }}>
                Alasan: {kyc.catatan ?? "-"}. Perbaiki datamu lalu kirim ulang.
              </p>
              <a className="btn" href="/daftar" style={{ marginTop: 14 }}>
                Kirim ulang
              </a>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
