import Link from "next/link";
import { TopNav, Footer } from "@/components/site";
import { KartuProduk } from "@/components/kartu-produk";
import { obrool, ApiError, waLink } from "@/lib/api";
import type { DaftarProduk } from "@/lib/tipe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Katalog" };

export default async function Katalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let data: DaftarProduk | null = null;
  let err: ApiError | null = null;
  try {
    data = await obrool<DaftarProduk>("/api/v1/catalog", { search: { q: query } });
  } catch (e) {
    err = e instanceof ApiError ? e : new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  const wa = waLink("Halo Tokowa, aku mau belanja.");
  const kosong = data && data.items.length === 0;

  return (
    <>
      <TopNav />
      <main className="section">
        <div className="container">
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Katalog</h1>
          <form className="filter" action="/katalog">
            <input
              type="search"
              name="q"
              placeholder="Cari produk atau warung"
              defaultValue={query}
              aria-label="Cari produk atau warung"
            />
            <button className="btn" type="submit">
              Cari
            </button>
          </form>

          {err && (
            <div className="galat">
              <h3>Tidak bisa memuat katalog</h3>
              <p>{err.message}</p>
              <a className="btn btn-ghost" href="/katalog">
                Coba lagi
              </a>
            </div>
          )}

          {kosong && (
            <div className="kosong">
              <h3>Belum ada produk yang cocok.</h3>
              <p lang="id">
                {query
                  ? `Belum ada hasil untuk "${query}". Coba kata kunci lain, atau tanyakan langsung lewat WhatsApp.`
                  : "Tanyakan butuhmu lewat WhatsApp, agent mencarikan dari warung terdekat."}
              </p>
              {wa && (
                <a className="btn" href={wa} target="_blank" rel="noreferrer">
                  Chat di WhatsApp
                </a>
              )}
            </div>
          )}

          {data && data.items.length > 0 && (
            <div className="prod-grid">
              {data.items.map((p) => (
                <KartuProduk key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
