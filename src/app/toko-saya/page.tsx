import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { TombolKeluar } from "@/components/tombol-keluar";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";

export const dynamic = "force-dynamic";

type KycRingkasan = {
  id: string;
  namaLegal: string;
  namaToko: string | null;
  status: string;
  catatan: string | null;
  updatedAt: string;
} | null;
type AgentLite = { id: string; name: string; channelConfig: { tokoEnabled?: boolean } };


export default async function TokoSaya() {
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let agents: AgentLite[] = [];
  let kyc: KycRingkasan = null;
  let galat: ApiError | null = null;
  try {
    const [a, k] = await Promise.all([
      obrool<{ agents: AgentLite[] }>("/api/agents?fields=lite", { token }),
      obrool<KycRingkasan>("/api/v1/seller/kyc", { token }),
    ]);
    agents = a.agents ?? [];
    kyc = k;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) redirect("/masuk");
    galat = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main>
        <div className="container dua-kolom">
          <aside>
            <nav className="menu-seller">
              <Link className="aktif" href="/toko-saya">Toko saya</Link>
              <Link href="/daftar">Verifikasi penjual</Link>
              <Link href="/verifikasi">Status verifikasi</Link>
            </nav>
            <div style={{ marginTop: 16 }}>
              <TombolKeluar />
            </div>
          </aside>

          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Toko saya</h1>
            {kyc?.status === "diterima" ? (
              <span className="chip chip-ok">Terverifikasi</span>
            ) : (
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>
                Lengkapi verifikasi penjual supaya toko tampil di katalog umum.{" "}
                <a href="/daftar" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                  Mulai verifikasi
                </a>
                {kyc?.status === "ditolak" && kyc.catatan ? (
                  <>
                    {" "}
                    · Pengajuan sebelumnya ditolak: {kyc.catatan}
                  </>
                ) : null}
              </p>
            )}

            {galat && (
              <div className="galat">
                <h3>Tidak bisa memuat daftar toko</h3>
                <p>{galat.message}</p>
                <Link className="btn btn-ghost" href="/toko-saya">
                  Coba lagi
                </Link>
              </div>
            )}

            {!galat && agents.length === 0 && (
              <div className="kosong">
                <h3>Belum ada toko.</h3>
                <p>Toko dibuat lewat tonda agent di obrool.</p>
              </div>
            )}

            {agents.length > 0 && (
              <div className="prod-grid">
                {agents.map((a) => (
                  <article key={a.id} className="prod-card">
                    <div className="prod-body">
                      <div className="prod-nama">{a.name}</div>
                      <div className="prod-toko">
                        Kanal WhatsApp · {a.channelConfig?.tokoEnabled === true ? "aktif" : "nonaktif"}
                      </div>
                      <div className="prod-bottom" style={{ marginTop: 8 }}>
                        <Link className="btn" style={{ padding: "6px 14px", fontSize: 13 }} href={`/toko-saya/${a.id}/pesanan`}>
                          Pesanan
                        </Link>
                        <Link className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 13 }} href={`/toko-saya/${a.id}/produk`}>
                          Produk
                        </Link>
                        <Link className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 13 }} href={`/toko-saya/${a.id}/pengaturan`}>
                          Pengaturan
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
