import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { rp } from "@/lib/format";
import { AksiSengketaToko } from "./aksi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sengketa" };

type SengketaRingkas = {
  id: string;
  kode: string;
  status: string;
  alasan: string;
  alasanTolakToko: string | null;
  batasTokoAt: string | null;
  putusan: string | null;
  refundTotal: number;
  catatanPutusan: string | null;
  dibuatAt: string;
  pesananKode: string;
  pesananTotal: number;
  ringkas: string;
  pembeliMask: string | null;
};

function Menu({ agentId }: { agentId: string }) {
  return (
    <nav className="menu-seller">
      <Link href="/toko-saya">Toko saya</Link>
      <Link href={`/toko-saya/${agentId}/beranda`}>Beranda</Link>
      <Link href={`/toko-saya/${agentId}/produk`}>Produk</Link>
      <Link href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
      <Link href={`/toko-saya/${agentId}/retur`}>Retur</Link>
      <Link className="aktif" href={`/toko-saya/${agentId}/sengketa`}>
        Sengketa
      </Link>
      <Link href={`/toko-saya/${agentId}/pengaturan`}>Pengaturan toko</Link>
    </nav>
  );
}

const formatBatas = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function HalamanSengketaToko({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let aktif: SengketaRingkas[] = [];
  let riwayat: SengketaRingkas[] = [];
  let galat: ApiError | null = null;
  try {
    const a = await obrool<{ items: SengketaRingkas[] }>("/api/v1/seller/sengketa", {
      token,
      search: { agentId },
    });
    aktif = a.items;
    const b = await obrool<{ items: SengketaRingkas[] }>("/api/v1/seller/sengketa", {
      token,
      search: { agentId, status: "riwayat" },
    });
    riwayat = b.items;
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
            <Menu agentId={agentId} />
          </aside>
          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Sengketa</h1>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>
              Pembeli membuka sengketa setelah retur ditolak atau masa retur lewat. Kamu
              menjawab dulu; bila kamu menolak atau lewat batas, admin Tokowa menengahi dan
              putusannya bisa menjadi teguran toko.
            </p>

            {galat && (
              <div className="galat">
                <h3>Tidak bisa memuat sengketa</h3>
                <p>{galat.message}</p>
                <Link className="btn btn-ghost" href={`/toko-saya/${agentId}/sengketa`}>
                  Coba lagi
                </Link>
              </div>
            )}

            {!galat && aktif.length === 0 && (
              <div className="kosong">
                <h3>Tidak ada sengketa yang menunggu.</h3>
                <p>Sengketa baru dari pembeli akan muncul di sini.</p>
              </div>
            )}

            {aktif.map((s) => (
              <article key={s.id} className="kartu" style={{ marginBottom: 16 }}>
                <div className="lacak-head">
                  <div>
                    <p className="lacak-kode">
                      Sengketa {s.kode} · pesanan #{s.pesananKode}
                    </p>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                      {s.status === "menunggu_toko" ? "Menunggu jawabanmu" : "Diperiksa admin"}
                    </h2>
                  </div>
                  <span className="chip chip-warn">
                    {s.status === "menunggu_toko" ? "Tahap toko" : "Tahap admin"}
                  </span>
                </div>

                {s.ringkas && <p style={{ marginTop: 8 }}>{s.ringkas}</p>}
                <p style={{ fontSize: 14, marginTop: 6 }}>Alasan pembeli: {s.alasan}</p>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  Total pesanan {rp(s.pesananTotal)}
                  {s.pembeliMask ? ` · pembeli ${s.pembeliMask}` : ""} · dibuka{" "}
                  {new Date(s.dibuatAt).toLocaleString("id-ID")}
                  {s.status === "menunggu_toko" && s.batasTokoAt
                    ? ` · jawab sebelum ${formatBatas(s.batasTokoAt)}`
                    : ""}
                </p>
                {s.status === "menunggu_admin" && s.alasanTolakToko && (
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>Alasan tolakmu: {s.alasanTolakToko}</p>
                )}

                {s.status === "menunggu_toko" && (
                  <AksiSengketaToko sengketaId={s.id} totalSaran={s.pesananTotal} />
                )}
              </article>
            ))}

            {riwayat.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--muted)" }}>
                  Sengketa selesai ({riwayat.length})
                </summary>
                <div className="tabel-wrap" style={{ marginTop: 12 }}>
                  <table className="tabel">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Kode</th>
                        <th>Hasil</th>
                        <th>Refund</th>
                      </tr>
                    </thead>
                  <tbody>
                    {riwayat.map((s) => (
                      <tr key={s.id}>
                        <td>{new Date(s.dibuatAt).toLocaleString("id-ID")}</td>
                        <td>
                          {s.kode} · #{s.pesananKode}
                        </td>
                        <td>
                          <span className={s.putusan === "untuk_pembeli" ? "chip chip-ok" : "chip chip-muted"}>
                            {s.putusan === "untuk_pembeli" ? "Untuk pembeli" : "Untuk toko"}
                          </span>
                        </td>
                        <td>{s.refundTotal > 0 ? rp(s.refundTotal) : "-"}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
