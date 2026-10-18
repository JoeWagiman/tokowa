import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pesanan" };

type PesananRingkas = {
  id: string;
  total: number;
  status: string;
  metodeBayar: string | null;
  adaBukti: boolean;
  pelanggan: string | null;
  jumlahItem: number;
  createdAt: string;
};

const labelStatus: Record<string, string> = {
  tunggu_bayar: "Tunggu bayar",
  tunggu_verifikasi: "Tunggu verifikasi",
  paid: "Terbayar",
  kirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

const stokKelas: Record<string, string> = {
  tunggu_bayar: "chip chip-warn",
  tunggu_verifikasi: "chip chip-warn",
  paid: "chip chip-ok",
  kirim: "chip chip-ok",
  selesai: "chip chip-muted",
  batal: "chip chip-muted",
};

export default async function HalamanPesanan({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let items: PesananRingkas[] = [];
  let galat: ApiError | null = null;
  try {
    const d = await obrool<{ items: PesananRingkas[] }>("/api/v1/seller/pesanan", {
      token,
      search: { agentId },
    });
    items = d.items;
  } catch (e) {
    const err = e instanceof ApiError ? e : null;
    if (err && (err.status === 404 || err.status === 403)) notFound();
    if (err && (err.status === 401 || err.status === 403)) redirect("/masuk");
    galat = err ?? new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  const belumSelesai = items.filter((p) => !["batal", "selesai"].includes(p.status));
  const sudah = items.filter((p) => ["batal", "selesai"].includes(p.status));

  return (
    <>
      <TopNav />
      <main>
        <div className="container dua-kolom">
          <aside>
            <nav className="menu-seller">
              <Link href="/toko-saya">Toko saya</Link>
              <Link href={`/toko-saya/${agentId}/produk`}>Produk</Link>
              <Link className="aktif" href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
              <Link href={`/toko-saya/${agentId}/retur`}>Retur</Link>
              <Link href={`/toko-saya/${agentId}/pengaturan`}>Pengaturan toko</Link>
            </nav>
          </aside>
          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Pesanan</h1>

            {galat && (
              <div className="galat">
                <h3>Tidak bisa memuat pesanan</h3>
                <p>{galat.message}</p>
                <Link className="btn btn-ghost" href={`/toko-saya/${agentId}/pesanan`}>
                  Coba lagi
                </Link>
              </div>
            )}

            {!galat && items.length === 0 && (
              <div className="kosong">
                <h3>Belum ada pesanan.</h3>
                <p>Pesanan masuk lewat WhatsApp akan tampil di sini.</p>
              </div>
            )}

            {belumSelesai.length > 0 && (
              <table className="tabel" style={{ marginBottom: 28 }}>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Pelanggan</th>
                    <th>Item</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {belumSelesai.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.createdAt).toLocaleString("id-ID")}</td>
                      <td>{p.pelanggan ? <a href={`https://wa.me/${p.pelanggan.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)" }}>{p.pelanggan}</a> : "-"}</td>
                      <td>{p.jumlahItem}</td>
                      <td>{p.total.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</td>
                      <td><span className={stokKelas[p.status] ?? "chip chip-muted"}>{labelStatus[p.status] ?? p.status}</span></td>
                      <td>
                        <Link className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13 }} href={`/toko-saya/${agentId}/pesanan/${p.id}`}>
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {sudah.length > 0 && (
              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                  Pesanan selesai & batal ({sudah.length})
                </summary>
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Pelanggan</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sudah.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.createdAt).toLocaleString("id-ID")}</td>
                        <td>{p.pelanggan ?? "-"}</td>
                        <td>{p.total.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</td>
                        <td><span className={stokKelas[p.status] ?? "chip chip-muted"}>{labelStatus[p.status] ?? p.status}</span></td>
                        <td>
                          <Link className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13 }} href={`/toko-saya/${agentId}/pesanan/${p.id}`}>
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
