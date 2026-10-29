import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { CabutSuspensi } from "./cabut-suspensi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar penjual" };

type Item = {
  agentId: string;
  nama: string;
  email: string | null;
  pemilik: string | null;
  statusKyc: string | null;
  catatan: string | null;
  jumlahProduk: number;
  teguranAktif: number;
  ambangTeguran: number;
  tersuspensi: boolean;
  suspensiAlasan: string | null;
  createdAt: string;
};

const cw: Record<string, string> = {
  menunggu: "chip chip-warn",
  diterima: "chip chip-ok",
  ditolak: "chip chip-muted",
};

const cl: Record<string, string> = {
  menunggu: "Menunggu",
  diterima: "Terverifikasi",
  ditolak: "Ditolak",
};

export default async function HalamanAdminPenjual({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let items: Item[] = [];
  let galat: ApiError | null = null;
  try {
    const d = await obrool<{ items: Item[] }>("/api/v1/admin/sellers", { token, search: { q } });
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
            <Link href="/admin/verifikasi" style={{ color: "var(--muted)" }}>Verifikasi</Link>
            <Link href="/admin/penjual" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Penjual</Link>
            <Link href="/admin/sengketa" style={{ color: "var(--muted)" }}>Sengketa</Link>
          </nav>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Daftar penjual</h1>

          <form className="filter" action="/admin/penjual">
            <input type="search" name="q" placeholder="Cari nama toko atau pemilik" defaultValue={q} aria-label="Cari penjual" />
            <button className="btn" type="submit">Cari</button>
          </form>

          {galat && (
            <div className="galat">
              <h3>Daftar tidak bisa dimuat</h3>
              <p>{galat.message}</p>
              <Link className="btn btn-ghost" href="/admin/penjual">Coba lagi</Link>
            </div>
          )}

          {!galat && items.length === 0 && (
            <div className="kosong">
              <h3>Belum ada penjual.</h3>
            </div>
          )}

          {!galat && items.length > 0 && (
            <div className="tabel-wrap">
              <table className="tabel">
              <thead>
                <tr>
                  <th>Toko</th>
                  <th>Pemilik</th>
                  <th>Produk</th>
                  <th>Verifikasi</th>
                  <th>Teguran</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.agentId}>
                    <td>{a.nama}</td>
                    <td>
                      {a.pemilik ?? "Belum ada"}
                      <br />
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>{a.email ?? ""}</span>
                    </td>
                    <td>{a.jumlahProduk}</td>
                    <td>
                      <span className={cw[a.statusKyc ?? ""] ?? "chip chip-muted"}>{cl[a.statusKyc ?? ""] ?? "Belum diajukan"}</span>
                    </td>
                    <td>
                      {a.tersuspensi ? (
                        <span className="chip chip-warn">Disuspensi</span>
                      ) : a.teguranAktif > 0 ? (
                        <span>
                          {a.teguranAktif} dari {a.ambangTeguran}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>Bersih</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <a href={`/toko/${a.agentId}`} style={{ color: "var(--accent-ink)", fontWeight: 600, fontSize: 13 }}>
                          Lihat toko
                        </a>
                        {a.tersuspensi && <CabutSuspensi agentId={a.agentId} nama={a.nama} />}
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
