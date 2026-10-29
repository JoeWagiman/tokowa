import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { rp } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Beranda penjual" };

type Analitik = {
  range: number;
  toko: string;
  perluPerhatian: {
    tungguVerifikasi: number;
    tungguBayar: number;
    returAktif: number;
    stokMenipis: number;
  };
  teguranAktif: number;
  ambangTeguran: number;
  tersuspensi: boolean;
  suspensiAlasan: string | null;
  total: {
    omzet: number;
    order: number;
    paid: number;
    rataRata: number;
    tingkatBayar: number;
    retur: number;
  };
  perStatus: Record<string, number>;
  harian: Array<{ tanggal: string; omzet: number; order: number }>;
  terlaris: Array<{ nama: string; qty: number; omzet: number }>;
};

const labelStatus: Record<string, string> = {
  draf: "Draf",
  tunggu_bayar: "Tunggu bayar",
  tunggu_verifikasi: "Tunggu verifikasi",
  paid: "Terbayar",
  kirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

function Menu({ agentId }: { agentId: string }) {
  return (
    <nav className="menu-seller">
      <Link href="/toko-saya">Toko saya</Link>
      <Link className="aktif" href={`/toko-saya/${agentId}/beranda`}>
        Beranda
      </Link>
      <Link href={`/toko-saya/${agentId}/produk`}>Produk</Link>
      <Link href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
      <Link href={`/toko-saya/${agentId}/retur`}>Retur</Link>
      <Link href={`/toko-saya/${agentId}/sengketa`}>Sengketa</Link>
      <Link href={`/toko-saya/${agentId}/pengaturan`}>Pengaturan toko</Link>
    </nav>
  );
}

const formatTanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });

export default async function HalamanBeranda({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { agentId } = await params;
  const { range } = await searchParams;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let d: Analitik | null = null;
  let galat: ApiError | null = null;
  try {
    d = await obrool<Analitik>("/api/v1/seller/analitik", {
      token,
      search: { agentId, ...(range === "30" ? { range: "30" } : {}) },
    });
  } catch (e) {
    const err = e instanceof ApiError ? e : null;
    if (err && (err.status === 404 || err.status === 403)) notFound();
    if (err && err.status === 401) redirect("/masuk");
    galat = err ?? new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  const pp = d?.perluPerhatian;
  const antrean: Array<{ label: string; jumlah: number; href: string; aksi: string }> = pp
    ? [
        {
          label: "Pembayaran menunggu pemeriksaanmu",
          jumlah: pp.tungguVerifikasi,
          href: `/toko-saya/${agentId}/pesanan`,
          aksi: "Periksa pesanan",
        },
        {
          label: "Pengajuan retur menunggu keputusan",
          jumlah: pp.returAktif,
          href: `/toko-saya/${agentId}/retur`,
          aksi: "Putuskan retur",
        },
        {
          label: "Pesanan belum dibayar pembeli",
          jumlah: pp.tungguBayar,
          href: `/toko-saya/${agentId}/pesanan`,
          aksi: "Lihat pesanan",
        },
        {
          label: "Produk stoknya menipis atau habis",
          jumlah: pp.stokMenipis,
          href: `/toko-saya/${agentId}/produk`,
          aksi: "Atur stok",
        },
      ].filter((a) => a.jumlah > 0)
    : [];

  return (
    <>
      <TopNav />
      <main>
        <div className="container dua-kolom">
          <aside>
            <Menu agentId={agentId} />
          </aside>
          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
              Beranda{d ? ` ${d.toko}` : ""}
            </h1>
            <p style={{ color: "var(--muted)", marginBottom: 16 }}>
              Yang perlu kamu kerjakan sekarang, lalu penjualan {d?.range === 30 ? "30 hari" : "7 hari"} terakhir.
            </p>

            <div className="baris-aksi" style={{ marginBottom: 20 }} role="group" aria-label="Rentang analitik">
              <Link className={`btn ${d?.range !== 30 ? "" : "btn-ghost"}`} href={`/toko-saya/${agentId}/beranda`}>
                7 hari
              </Link>
              <Link className={`btn ${d?.range === 30 ? "" : "btn-ghost"}`} href={`/toko-saya/${agentId}/beranda?range=30`}>
                30 hari
              </Link>
            </div>

            {galat && (
              <div className="galat">
                <h3>Beranda tidak bisa dimuat</h3>
                <p>{galat.message}</p>
                <Link className="btn btn-ghost" href={`/toko-saya/${agentId}/beranda`}>
                  Coba lagi
                </Link>
              </div>
            )}

            {d && (
              <>
                {(d.tersuspensi || d.teguranAktif > 0) && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      marginBottom: 20,
                      background: d.tersuspensi ? "var(--danger-soft)" : "var(--warn-soft)",
                      color: d.tersuspensi ? "var(--danger-ink)" : "var(--warn-ink)",
                      fontSize: 14,
                    }}
                    role="status"
                  >
                    {d.tersuspensi ? (
                      <>
                        <strong>Tokomu sedang disuspensi</strong>
                        {d.suspensiAlasan ? `: ${d.suspensiAlasan}` : ""}. Pesanan baru dari web,
                        katalog, dan chat platform berhenti dulu. Selesaikan sengketa yang terbuka,
                        lalu hubungi admin Tokowa untuk peninjauan.
                      </>
                    ) : (
                      <>
                        Teguran toko: <strong>{d.teguranAktif} dari {d.ambangTeguran}</strong> dalam
                        90 hari. Teguran datang dari sengketa yang dimenangkan pembeli setelah toko
                        menolak; mencapai ambang berarti suspensi.
                      </>
                    )}
                  </div>
                )}

                <section aria-label="Perlu perhatian" style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Perlu perhatian</h2>
                  {antrean.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      Tidak ada yang menunggu. Pesanan, retur, dan stok lagi aman.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {antrean.map((a) => (
                        <div
                          key={a.label}
                          className="kartu"
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 16px" }}
                        >
                          <p style={{ fontSize: 14 }}>
                            <strong>{a.jumlah}</strong> {a.label}
                          </p>
                          <Link className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13 }} href={a.href}>
                            {a.aksi}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section aria-label="Ringkasan penjualan" style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
                    Penjualan {d.range} hari terakhir
                  </h2>
                  {d.total.order === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      Belum ada pesanan pada rentang ini. Pesanan dari web dan chat akan tercatat di sini.
                    </p>
                  ) : (
                    <>
                      <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{rp(d.total.omzet)}</p>
                      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
                        Omzet dari {d.total.paid} pesanan terbayar
                      </p>
                      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, fontSize: 14 }}>
                        <div>
                          <dt style={{ color: "var(--muted)", fontSize: 13 }}>Semua pesanan</dt>
                          <dd style={{ margin: 0, fontWeight: 700 }}>{d.total.order}</dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--muted)", fontSize: 13 }}>Rata-rata pesanan terbayar</dt>
                          <dd style={{ margin: 0, fontWeight: 700 }}>{rp(d.total.rataRata)}</dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--muted)", fontSize: 13 }}>Tingkat bayar</dt>
                          <dd style={{ margin: 0, fontWeight: 700 }}>{d.total.tingkatBayar}%</dd>
                        </div>
                        <div>
                          <dt style={{ color: "var(--muted)", fontSize: 13 }}>Retur diajukan</dt>
                          <dd style={{ margin: 0, fontWeight: 700 }}>{d.total.retur}</dd>
                        </div>
                      </dl>
                      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>
                        Rincian status:{" "}
                        {Object.entries(d.perStatus)
                          .map(([s, n]) => `${labelStatus[s] ?? s} ${n}`)
                          .join(" · ")}
                      </p>
                    </>
                  )}
                </section>

                {d.terlaris.length > 0 && (
                  <section aria-label="Produk terlaris" style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Produk terlaris</h2>
                    <table className="tabel">
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th>Terjual</th>
                          <th>Omzet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.terlaris.slice(0, 5).map((t) => (
                          <tr key={t.nama}>
                            <td>{t.nama}</td>
                            <td>{t.qty}</td>
                            <td>{rp(t.omzet)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                {d.total.order > 0 && (
                  <section aria-label="Penjualan per hari">
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Per hari</h2>
                    <table className="tabel">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>Pesanan</th>
                          <th>Omzet terbayar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...d.harian].reverse().map((h) => (
                          <tr key={h.tanggal}>
                            <td>{formatTanggal(h.tanggal)}</td>
                            <td>{h.order}</td>
                            <td>{h.omzet > 0 ? rp(h.omzet) : "Rp0"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
