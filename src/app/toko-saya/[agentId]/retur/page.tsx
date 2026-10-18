import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { rp } from "@/lib/format";
import { AksiRetur } from "./aksi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retur" };

type ReturRingkas = {
  id: string;
  kode: string;
  pesananKode: string;
  status: string;
  alasan: string;
  catatan: string | null;
  refundTotal: number;
  refundCatatan: string | null;
  pesananTotal: number;
  ringkas: string;
  pelanggan: string | null;
  createdAt: string;
};

const labelAlasan: Record<string, string> = {
  rusak: "Barang rusak",
  basi: "Barang basi",
  salah: "Salah kirim",
  tidak_sesuai: "Tidak sesuai pesanan",
  berubah_pikiran: "Berubah pikiran",
  lain: "Alasan lain",
};

const labelStatus: Record<string, string> = {
  diajukan: "Menunggu keputusan",
  disetujui: "Disetujui, tunggu barang",
  ditolak: "Ditolak",
  barang_diterima: "Barang diterima",
  refund: "Refund diproses",
  selesai: "Selesai",
};

const kelasStatus: Record<string, string> = {
  diajukan: "chip chip-warn",
  disetujui: "chip chip-warn",
  ditolak: "chip chip-muted",
  barang_diterima: "chip chip-ok",
  refund: "chip chip-ok",
  selesai: "chip chip-muted",
};

function Menu({ agentId, aktif }: { agentId: string; aktif: string }) {
  return (
    <nav className="menu-seller">
      <Link href="/toko-saya">Toko saya</Link>
      <Link href={`/toko-saya/${agentId}/produk`}>Produk</Link>
      <Link href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
      <Link className={aktif === "retur" ? "aktif" : undefined} href={`/toko-saya/${agentId}/retur`}>
        Retur
      </Link>
      <Link href={`/toko-saya/${agentId}/pengaturan`}>Pengaturan toko</Link>
    </nav>
  );
}

export default async function HalamanRetur({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let aktif: ReturRingkas[] = [];
  let riwayat: ReturRingkas[] = [];
  let galat: ApiError | null = null;
  try {
    const d = await obrool<{ items: ReturRingkas[] }>("/api/v1/seller/retur", {
      token,
      search: { agentId },
    });
    aktif = d.items;
    const r = await obrool<{ items: ReturRingkas[] }>("/api/v1/seller/retur", {
      token,
      search: { agentId, status: "riwayat" },
    });
    riwayat = r.items;
  } catch (e) {
    const err = e instanceof ApiError ? e : null;
    if (err && (err.status === 401 || err.status === 404)) redirect("/masuk");
    galat = err ?? new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main>
        <div className="container dua-kolom">
          <aside>
            <Menu agentId={agentId} aktif="retur" />
          </aside>
          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Retur</h1>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>
              Pengajuan retur dari pembeli lewat halaman lacak. Uang hanya keluar saat kamu
              mencatat refund di langkah terakhir.
            </p>

            {galat && (
              <div className="galat">
                <h3>Tidak bisa memuat retur</h3>
                <p>{galat.message}</p>
                <Link className="btn btn-ghost" href={`/toko-saya/${agentId}/retur`}>
                  Coba lagi
                </Link>
              </div>
            )}

            {!galat && aktif.length === 0 && (
              <div className="kosong">
                <h3>Tidak ada retur yang menunggu.</h3>
                <p>Pengajuan baru dari pembeli akan muncul di sini.</p>
              </div>
            )}

            {aktif.map((r) => (
              <article key={r.id} className="kartu" style={{ marginBottom: 16 }}>
                <div className="lacak-head">
                  <div>
                    <p className="lacak-kode">
                      Retur {r.kode} · pesanan #{r.pesananKode}
                    </p>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>{labelAlasan[r.alasan] ?? r.alasan}</h2>
                  </div>
                  <span className={kelasStatus[r.status] ?? "chip chip-muted"}>
                    {labelStatus[r.status] ?? r.status}
                  </span>
                </div>

                {r.ringkas && <p style={{ marginTop: 8 }}>{r.ringkas}</p>}
                {r.catatan && (
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>Catatan pembeli: {r.catatan}</p>
                )}
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  Total pesanan {rp(r.pesananTotal)}
                  {r.pelanggan ? ` · pembeli ${r.pelanggan}` : ""} · diajukan{" "}
                  {new Date(r.createdAt).toLocaleString("id-ID")}
                </p>
                {r.refundTotal > 0 && (
                  <p style={{ fontSize: 14 }}>
                    Refund tercatat {rp(r.refundTotal)}
                    {r.refundCatatan ? ` (${r.refundCatatan})` : ""}
                  </p>
                )}

                <AksiRetur returId={r.id} status={r.status} totalSaran={r.pesananTotal} />
              </article>
            ))}

            {riwayat.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--muted)" }}>
                  Retur selesai & ditolak ({riwayat.length})
                </summary>
                <table className="tabel" style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Kode</th>
                      <th>Alasan</th>
                      <th>Hasil</th>
                      <th>Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                        <td>
                          {r.kode} · #{r.pesananKode}
                        </td>
                        <td>{labelAlasan[r.alasan] ?? r.alasan}</td>
                        <td>
                          <span className={kelasStatus[r.status] ?? "chip chip-muted"}>
                            {labelStatus[r.status] ?? r.status}
                          </span>
                        </td>
                        <td>{r.refundTotal > 0 ? rp(r.refundTotal) : "-"}</td>
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
