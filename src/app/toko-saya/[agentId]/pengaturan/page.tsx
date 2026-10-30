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
  wabaSendiri: boolean;
  nomorJualan: string | null;
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
              <Link href={`/toko-saya/${agentId}/beranda`}>Beranda</Link>
              <Link href={`/toko-saya/${agentId}/produk`}>Produk</Link>
              <Link href={`/toko-saya/${agentId}/pesanan`}>Pesanan</Link>
              <Link href={`/toko-saya/${agentId}/retur`}>Retur</Link>
              <Link href={`/toko-saya/${agentId}/sengketa`}>Sengketa</Link>
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
            {setting && (
              <section className="kartu" style={{ marginTop: 16 }} aria-label="Nomor WhatsApp sendiri">
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nomor WhatsApp sendiri</h2>
                {setting.wabaSendiri === true ? (
                  <p style={{ fontSize: 14 }}>
                    <span className="chip chip-ok">Toko mandiri</span>
                    <span style={{ color: "var(--muted)" }}>
                      {" "}
                      Chat pembeli langsung ke {setting.nomorJualan ?? "nomormu"}; tokomu tetap
                      direkomendasikan di Tokowa.
                    </span>
                  </p>
                ) : (
                  <>
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      Saat ini pembeli chat lewat nomor platform Tokowa. Punya WABA sendiri
                      artinya chat pindah ke nomormu, tetapi pendaftarannya lewat obrool dan
                      butuh persiapan. Baca syaratnya dulu sebelum lanjut.
                    </p>
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                        Syarat pengajuan WABA sendiri
                      </summary>
                      <ul style={{ color: "var(--muted)", fontSize: 14, paddingLeft: 20, marginTop: 8, display: "grid", gap: 6 }}>
                        <li>Dokumen legalitas usaha (mis. NIB) untuk verifikasi bisnis Meta.</li>
                        <li>Kartu kredit untuk tagihan percakapan WhatsApp.</li>
                        <li>Nomor HP aktif yang belum terdaftar di WhatsApp mana pun.</li>
                        <li>Akun Facebook Business Manager atas nama usaha.</li>
                        <li>Waktu tunggu verifikasi hitungan hari sampai minggu; siapkan juga email aktif.</li>
                      </ul>
                    </details>
                    <div className="baris-aksi">
                      <a
                        className="btn"
                        href={`${process.env.NEXT_PUBLIC_OBROOL_URL ?? "https://obrool.com"}/dashboard`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lanjut daftar di obrool
                      </a>
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
                      Status mandiri diaktifkan obrool setelah nomormu disetujui; tidak bisa
                      diaktifkan dari sini.
                    </p>
                  </>
                )}
              </section>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
