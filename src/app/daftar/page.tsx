import { redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { FormKyc } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi penjual" };

type Kyc = { namaLegal: string; status: string; catatan: string | null } | null;

export default async function HalamanDaftar() {
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
        <div className="container" style={{ padding: "28px 20px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Verifikasi penjual</h1>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Toko muncul di katalog umum setelah verifikasi lolos.
          </p>
          {galat && (
            <div className="galat">
              <h3>Status verifikasi tidak bisa dimuat</h3>
              <p>{galat.message}</p>
              <a className="btn btn-ghost" href="/daftar">
                Coba lagi
              </a>
            </div>
          )}
          {!galat && <FormKyc awal={kyc ? { status: kyc.status, catatan: kyc.catatan, namaLegal: kyc.namaLegal } : { status: null, catatan: null, namaLegal: null }} r2Idup={true} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
