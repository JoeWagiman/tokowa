import { TopNav, Footer } from "@/components/site";
import { KartuProduk } from "@/components/kartu-produk";
import { obrool, ApiError } from "@/lib/api";
import { rp, stokStatus, stokLabel } from "@/lib/format";
import { waLink } from "@/lib/api";
import type { ProdukDetail } from "@/lib/tipe";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const chipKelas = { habis: "chip chip-muted", menipis: "chip chip-warn", ada: "chip chip-ok" } as const;

export default async function HalamanProduk({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let p: ProdukDetail | null = null;
  let err: ApiError | null = null;
  try {
    p = await obrool<ProdukDetail>(`/api/v1/catalog/products/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    err = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main className="section">
        <div className="container">
          {err && (
            <div className="galat">
              <h3>Produk tidak bisa dimuat</h3>
              <p>{err.message}</p>
              <a className="btn btn-ghost" href={`/produk/${encodeURIComponent(id)}`}>
                Coba lagi
              </a>
            </div>
          )}
          {p && <Isi p={p} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Isi({ p }: { p: ProdukDetail }) {
  const s = stokStatus(p.stok, p.ambang);
  const wa = waLink(`Halo, saya lihat "${p.nama}" (${rp(p.harga)}) di katalog. Masih ada?`);
  return (
    <article className="detail">
      <figure className="detail-foto" style={{ margin: 0 }}>
        {p.foto ? (
          <img src={p.foto} alt={p.nama} />
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)" }}>
            [foto produk]
          </div>
        )}
      </figure>
      <aside>
        <h1>{p.nama}</h1>
        <div className="detail-harga">{rp(p.harga)}</div>
        <span className={chipKelas[s]}>{stokLabel[s]}</span>

        <p style={{ marginTop: 20 }}>
          Dijual oleh{" "}
          <a href={`/toko/${p.agentId}`} style={{ fontWeight: 600, color: "var(--accent-ink)" }}>
            {p.toko}
          </a>
          {p.jamOperasional ? ` · buka ${p.jamOperasional.buka}–${p.jamOperasional.tutup}` : null}
        </p>

        {p.satuan.length > 0 && (
          <ul style={{ color: "var(--muted)", paddingLeft: 18 }}>
            {p.satuan.map((u, i) => (
              <li key={i}>{u.nama}</li>
            ))}
          </ul>
        )}

        <div className="detail-cta">
          {wa ? (
            <a className="btn" href={wa} target="_blank" rel="noreferrer">
              Tanya ketersediaan di WhatsApp
            </a>
          ) : (
            <button className="btn" disabled title="Nomor WhatsApp belum diatur">
              Tanya ketersediaan di WhatsApp
            </button>
          )}
          <span className="cta-note">Pembelian lanjut di WhatsApp, dibantu agent.</span>
        </div>
      </aside>
    </article>
  );
}
