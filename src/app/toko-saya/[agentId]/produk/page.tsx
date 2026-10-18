import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { CrudProduk } from "./crud";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produk" };

type AgentLite = { id: string; name: string };

export default async function HalamanProdukSeller({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let namaToko = "";
  let galat: ApiError | null = null;
  try {
    const a = await obrool<{ agent: AgentLite }>(`/api/agents?agentId=${encodeURIComponent(agentId)}`, { token });
    namaToko = a.agent.name;
  } catch (e) {
    const err = e instanceof ApiError ? e : null;
    if (err && (err.status === 404 || err.status === 403)) notFound();
    if (err && (err.status === 401 || err.status === 403)) redirect("/masuk");
    galat = err ?? new ApiError("unavailable", "Layanan sedang tidak tersedia. Coba lagi nanti.", 500);
  }

  return (
    <>
      <TopNav />
      <main>
        <div className="container dua-kolom">
          <aside>
            <nav className="menu-seller">
              <Link href="/toko-saya">Toko saya</Link>
              <Link className="aktif" href={`/toko-saya/${agentId}/produk`}>Produk</Link>
              <Link href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
              <Link href={`/toko-saya/${agentId}/retur`}>Retur</Link>
              <Link href={`/toko-saya/${agentId}/pengaturan`}>Pengaturan toko</Link>
            </nav>
          </aside>
          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Produk · {namaToko}</h1>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>
              Format satuan opsional: <code>renceng:10, dus:40</code> (nama: isi).
            </p>
            <CrudProduk agentId={agentId} galatAwal={galat?.message ?? ""} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
