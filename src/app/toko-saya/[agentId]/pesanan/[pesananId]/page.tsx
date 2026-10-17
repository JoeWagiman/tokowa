import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav, Footer } from "@/components/site";
import { obrool, ApiError } from "@/lib/api";
import { sesiToken } from "@/lib/sesi";
import { AksiPesanan } from "./aksi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola pesanan" };

type Detail = {
  id: string;
  status: string;
  total: number;
  metodeBayar: string | null;
  bukti: string | null;
  pelanggan: string | null;
  bayarUrl: string | null;
  bayarExpiredAt: string | null;
  items: Array<{ nama: string; qty: number; satuan: string; harga: number }>;
  createdAt: string;
  updatedAt: string;
};

const labelStatus: Record<string, string> = {
  tunggu_bayar: "Tunggu bayar",
  tunggu_verifikasi: "Tunggu verifikasi",
  paid: "Terbayar",
  kirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

const cw: Record<string, string> = {
  tunggu_bayar: "chip chip-warn",
  tunggu_verifikasi: "chip chip-warn",
  paid: "chip chip-ok",
  kirim: "chip chip-ok",
  selesai: "chip chip-muted",
  batal: "chip chip-muted",
};

export default async function HalamanDetailPesanan({
  params,
}: {
  params: Promise<{ agentId: string; pesananId: string }>;
}) {
  const { agentId, pesananId } = await params;
  const token = await sesiToken();
  if (!token) redirect("/masuk");

  let d: Detail | null = null;
  let galat: ApiError | null = null;
  try {
    d = await obrool<Detail>(`/api/v1/seller/pesanan/${encodeURIComponent(pesananId)}`, { token });
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
        <div className="container" style={{ padding: "28px 20px", maxWidth: 820 }}>
          <Link href={`/toko-saya/${agentId}/pesanan`} style={{ fontSize: 14, color: "var(--accent-ink)", fontWeight: 600 }}>
            ← Semua pesanan
          </Link>

          {galat && (
            <div className="galat" style={{ padding: "20px 0" }}>
              <h3>Pesanan tidak bisa dimuat</h3>
              <p>{galat.message}</p>
              <Link className="btn btn-ghost" href={`/toko-saya/${agentId}/pesanan/${encodeURIComponent(pesananId)}`}>
                Coba lagi
              </Link>
            </div>
          )}

          {d && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 8px" }}>
                Pesanan #{d.id.slice(-6).toUpperCase()}
                {"  "}
                <span className={cw[d.status] ?? "chip chip-muted"}>{labelStatus[d.status] ?? d.status}</span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                {new Date(d.createdAt).toLocaleString("id-ID")}
                {d.pelanggan ? (
                  <>
                    {" · dari "}
                    <a href={`https://wa.me/${d.pelanggan.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                      {d.pelanggan}
                    </a>
                  </>
                ) : null}
                {d.metodeBayar ? ` · ${d.metodeBayar}` : ""}
              </p>

              <table className="tabel">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((i, k) => (
                    <tr key={k}>
                      <td>{i.nama}</td>
                      <td>
                        {i.qty} {i.satuan}
                      </td>
                      <td>
                        {i.harga.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: 700 }}>Total</td>
                    <td />
                    <td style={{ fontWeight: 700 }}>
                      {d.total.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {d.bukti && (
                <p style={{ marginTop: 14, fontSize: 14, color: "var(--muted)" }}>
                  Bukti transfer:{" "}
                  <a href={d.bukti} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                    lihat bukti
                  </a>
                </p>
              )}
              {d.bayarUrl && ["tunggu_bayar"].includes(d.status) && (
                <p style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>
                  Paylink QRIS aktif sampai{" "}
                  {d.bayarExpiredAt ? new Date(d.bayarExpiredAt).toLocaleString("id-ID") : "?"}.{" "}
                  <a href={d.bayarUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                    buka paylink
                  </a>
                </p>
              )}

              <AksiPesanan agentId={agentId} pesananId={d.id} status={d.status} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
