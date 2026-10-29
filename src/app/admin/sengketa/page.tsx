import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { rp } from "@/lib/format";
import { KeputusanSengketa } from "./keputusan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sengketa" };

type Item = {
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
  toko: string;
  pesananKode: string;
  pesananTotal: number;
  pesananStatus: string | null;
  ringkas: string;
  pembeliMask: string | null;
};

export default async function HalamanAdminSengketa() {
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let dibuka: Item[] = [];
  let diToko: Item[] = [];
  let selesai: Item[] = [];
  let galat: ApiError | null = null;
  try {
    const a = await obrool<{ items: Item[] }>("/api/v1/admin/sengketa", { token, search: { status: "menunggu_admin" } });
    dibuka = a.items;
    const t = await obrool<{ items: Item[] }>("/api/v1/admin/sengketa", { token, search: { status: "menunggu_toko" } });
    diToko = t.items;
    const b = await obrool<{ items: Item[] }>("/api/v1/admin/sengketa", { token, search: { status: "selesai" } });
    selesai = b.items;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) redirect("/masuk");
    galat = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main>
        <div className="container" style={{ padding: "28px 20px" }}>
          <nav style={{ display: "flex", gap: 18, marginBottom: 18, fontWeight: 500 }} aria-label="Admin">
            <Link href="/admin/verifikasi" style={{ color: "var(--muted)" }}>Verifikasi</Link>
            <Link href="/admin/penjual" style={{ color: "var(--muted)" }}>Penjual</Link>
            <Link href="/admin/sengketa" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Sengketa</Link>
          </nav>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Sengketa pembeli</h1>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Sengketa sampai ke mejamu setelah toko menolak atau lewat batas menjawab.
            Putusan untuk pembeli tercatat sebagai teguran toko; tiga teguran dalam 90 hari
            membuat toko disuspensi.
          </p>

          {galat && (
            <div className="galat">
              <h3>Sengketa tidak bisa dimuat</h3>
              <p>{galat.message}</p>
              <Link className="btn btn-ghost" href="/admin/sengketa">Coba lagi</Link>
            </div>
          )}

          {!galat && dibuka.length === 0 && (
            <div className="kosong">
              <h3>Tidak ada sengketa yang menunggu.</h3>
              <p>Sengketa baru dari pembeli akan muncul di sini.</p>
            </div>
          )}

          {!galat &&
            dibuka.map((s) => (
              <section key={s.id} className="kartu" style={{ marginBottom: 16, maxWidth: 760 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>
                      {s.kode} · pesanan #{s.pesananKode}
                    </h2>
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                      {s.toko} · total pesanan {rp(s.pesananTotal)} · pembeli {s.pembeliMask ?? "-"} · dibuka{" "}
                      {new Date(s.dibuatAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="chip chip-warn">Menunggu putusan</span>
                </div>
                {s.ringkas && <p style={{ fontSize: 14, marginTop: 8 }}>{s.ringkas}</p>}
                <p style={{ fontSize: 14, marginTop: 6 }}>
                  Alasan pembeli: <span style={{ color: "var(--ink)" }}>{s.alasan}</span>
                </p>
                {s.alasanTolakToko && (
                  <p style={{ fontSize: 14, marginTop: 6 }}>
                    Alasan toko menolak: <span style={{ color: "var(--ink)" }}>{s.alasanTolakToko}</span>
                  </p>
                )}
                <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "12px 0" }} />
                <KeputusanSengketa id={s.id} totalSaran={s.pesananTotal} />
              </section>
            ))}

          {!galat && diToko.length > 0 && (
            <section aria-label="Menunggu jawaban toko" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
                Masih menunggu jawaban toko ({diToko.length})
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {diToko.map((s) => (
                  <p key={s.id} className="kartu" style={{ padding: "10px 14px", fontSize: 14 }}>
                    {s.kode} · #{s.pesananKode} · {s.toko}
                    {s.batasTokoAt
                      ? ` · batas jawab ${new Date(s.batasTokoAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                      : ""}
                  </p>
                ))}
              </div>
            </section>
          )}

          {!galat && selesai.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--muted)" }}>
                Sengketa selesai ({selesai.length})
              </summary>
              <div className="tabel-wrap" style={{ marginTop: 12 }}>
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Kode</th>
                      <th>Toko</th>
                      <th>Putusan</th>
                    <th>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {selesai.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.dibuatAt).toLocaleString("id-ID")}</td>
                      <td>
                        {s.kode} · #{s.pesananKode}
                      </td>
                      <td>{s.toko}</td>
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
        </div>
      </main>
      <Footer />
    </>
  );
}
