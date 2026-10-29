import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { KeputusanKyc } from "./keputusan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Antrean verifikasi" };

type Item = {
  id: string;
  userId: string;
  namaLegal: string;
  namaToko: string | null;
  alamat: string;
  fotoKtp: string;
  fotoNpwp: string | null;
  status: string;
  catatan: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null };
};

export default async function HalamanAdminVerifikasi() {
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let items: Item[] = [];
  let galat: ApiError | null = null;
  try {
    const d = await obrool<{ items: Item[] }>("/api/v1/admin/kyc", { token, search: { status: "menunggu" } });
    items = d.items;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) redirect("/masuk");
    galat = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main>
        <div className="container" style={{ padding: "28px 20px" }}>
          <nav style={{ display: "flex", gap: 18, marginBottom: 18, fontWeight: 500 }}>
            <Link href="/admin/verifikasi" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Verifikasi</Link>
            <Link href="/admin/penjual" style={{ color: "var(--muted)" }}>Penjual</Link>
            <Link href="/admin/sengketa" style={{ color: "var(--muted)" }}>Sengketa</Link>
          </nav>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Antrean verifikasi penjual</h1>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Putuskan pengajuan penjual. Hasilnya langsung terlihat penjual di halaman Status verifikasi.
          </p>
          {galat && (
            <div className="galat">
              <h3>Antrean tidak bisa dimuat</h3>
              <p>{galat.message}</p>
              <Link className="btn btn-ghost" href="/admin/verifikasi">Coba lagi</Link>
            </div>
          )}

          {!galat && items.length === 0 && (
            <div className="kosong">
              <h3>Antrean kosong.</h3>
            </div>
          )}

          {!galat && items.map((k) => (
            <section key={k.id} className="kartu" style={{ marginBottom: 16, maxWidth: 760 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>{k.namaToko || k.namaLegal}</h2>
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>
                    {k.user.name ?? "-"} · {k.user.email ?? "-"} · diajukan {new Date(k.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <dl style={{ fontSize: 14, color: "var(--muted)", margin: "10px 0", display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 6 }}>
                <dt>Nama legal</dt><dd style={{ margin: 0, color: "var(--ink)" }}>{k.namaLegal}</dd>
                <dt>Alamat</dt><dd style={{ margin: 0, color: "var(--ink)" }}>{k.alamat}</dd>
              </dl>
              <div className="baris-aksi" style={{ marginBottom: 14 }}>
                <a className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13 }} href={k.fotoKtp} target="_blank" rel="noreferrer">Buka foto KTP</a>
                {k.fotoNpwp && <a className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13 }} href={k.fotoNpwp} target="_blank" rel="noreferrer">Buka foto NPWP</a>}
              </div>
              <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "12px 0" }} />
              <KeputusanKyc id={k.id} />
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
