import { TopNav, Footer } from "@/components/site";
import { KartuProduk } from "@/components/kartu-produk";
import { obrool, ApiError, waLink } from "@/lib/api";
import type { InfoToko } from "@/lib/tipe";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HalamanToko({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  let t: InfoToko | null = null;
  let err: ApiError | null = null;
  try {
    t = await obrool<InfoToko>(`/api/v1/catalog/stores/${encodeURIComponent(agentId)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    err = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  const jam = t?.jamOperasional;
  const wa = waLink(`Halo, saya lihat ${t ? t.nama : "toko"} di Tokowa.`);

  return (
    <>
      <TopNav />
      <main className="section">
        <div className="container">
          {err && (
            <div className="galat">
              <h3>Toko tidak bisa dimuat</h3>
              <p>{err.message}</p>
              <a className="btn btn-ghost" href={`/toko/${encodeURIComponent(agentId)}`}>
                Coba lagi
              </a>
            </div>
          )}
          {t && (
            <>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{t.nama}</h1>
              <p className="toko-meta">
                Dikelola oleh {t.pemilik ?? t.nama}
                {jam ? ` · ${jam.hari && jam.hari.length ? jam.hari.join(", ") : "setiap hari"} · ${jam.buka}–${jam.tutup}` : ""}
              </p>
              {t.items.length === 0 ? (
                <div className="kosong">
                  <h3>Belum ada produk di toko ini.</h3>
                  {wa && (
                    <a className="btn" href={wa} target="_blank" rel="noreferrer">
                      Chat di WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <div className="prod-grid">
                  {t.items.map((p) => (
                    <KartuProduk key={p.id} p={{ ...p, agentId: t.agentId, toko: t.nama, pemilik: t.pemilik }} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
