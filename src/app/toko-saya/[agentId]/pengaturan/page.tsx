import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { FormPengaturan } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan toko" };

type Setting = {
  jamBuka: string | null;
  jamTutup: string | null;
  hariBuka: string | null;
  jendelaReturHari: number;
  ongkirRetur: string | null;
  ongkirSellerFlat: number | null;
  kurirInstanDasar: number | null;
  kurirInstanPerKm: number | null;
  kurirInstanJarakMaksKm: number | null;
  lat: number | null;
  lng: number | null;
  qrisStatisNama: string | null;
  qrisStatisUrl: string | null;
};

export default async function HalamanPengaturan({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let setting: Setting | null = null;
  let galat: ApiError | null = null;
  try {
    const s = await obrool<{ setting: Setting }>(`/api/v1/seller/setting`, { token, search: { agentId } });
    setting = s.setting;
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
              <Link href={`/toko-saya/${agentId}/produk`}>Produk</Link>
              <Link href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
              <Link href={`/toko-saya/${agentId}/retur`}>Retur</Link>
              <Link className="aktif" href={`/toko-saya/${agentId}/pengaturan`}>Pengaturan toko</Link>
            </nav>
          </aside>
          <section>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Pengaturan toko</h1>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>
              Dipakai bot WhatsApp saat menawarkan barang. QRIS statis dipakai bila pembayaran melalui mode "Qris toko".
            </p>
            {galat && (
              <div className="galat">
                <h3>Tidak bisa memuat pengaturan</h3>
                <p>{galat.message}</p>
                <Link className="btn btn-ghost" href={`/toko-saya/${agentId}/pengaturan`}>
                  Coba lagi
                </Link>
              </div>
            )}
            {setting && <FormPengaturan agentId={agentId} setting={setting} />}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
