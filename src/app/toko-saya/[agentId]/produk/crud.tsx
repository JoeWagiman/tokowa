"use client";

import { useEffect, useState } from "react";
import { rp } from "@/lib/format";

type Produk = {
  id: string;
  nama: string;
  alias: string;
  harga: number;
  stok: number;
  ambang: number;
  satuan: string;
  foto: string | null;
  aktif: boolean;
};

type FormState = {
  id: string | null;
  nama: string;
  harga: string;
  stok: string;
  ambang: string;
  alias: string;
  satuan: string;
  foto: string;
};

const kosong: FormState = { id: null, nama: "", harga: "", stok: "", ambang: "5", alias: "", satuan: "", foto: "" };

function bukaEdit(p: Produk): FormState {
  let alias = "";
  let satuan = "";
  try {
    alias = (JSON.parse(p.alias || "[]") as string[]).join(", ");
  } catch {}
  try {
    satuan = (JSON.parse(p.satuan || "[]") as Array<{ nama: string; isi: number }>)
      .map((s) => `${s.nama}:${s.isi}`)
      .join(", ");
  } catch {}
  return {
    id: p.id,
    nama: p.nama,
    harga: String(p.harga),
    stok: String(p.stok),
    ambang: String(p.ambang),
    alias,
    satuan,
    foto: p.foto ?? "",
  };
}

export function CrudProduk({ agentId, galatAwal }: { agentId: string; galatAwal: string }) {
  const [daftar, setDaftar] = useState<Produk[]>([]);
  const [cari, setCari] = useState("");
  const [form, setForm] = useState<FormState>(kosong);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [muat, setMuat] = useState(true);
  const [galatMuat, setGalatMuat] = useState(galatAwal);

  async function muatUlang() {
    setMuat(true);
    setGalatMuat("");
    try {
      const res = await fetch(`/api/proxy/agents/${agentId}/toko/produk?limit=200`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "");
      setDaftar(body.produk ?? []);
    } catch {
      setGalatMuat("Tidak bisa memuat daftar produk. Coba lagi nanti.");
    } finally {
      setMuat(false);
    }
  }

  useEffect(() => {
    void muatUlang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unggahFoto(file: File): Promise<{ url?: string; galat?: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/proxy/agents/${agentId}/toko/foto`, { method: "POST", body: fd });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.url) return { galat: body?.error ?? "Unggahan gagal." };
    return { url: body.url as string };
  }

  async function simpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPesan(null);
    let foto = String(fd.get("foto") ?? "");
    const file = fd.get("berkas");
    if (file instanceof File && file.size > 0) {
      setPesan({ jenis: "ok", teks: "Mengunggah foto…" });
      const up = await unggahFoto(file);
      if (up.galat) {
        setPesan({ jenis: "galat", teks: up.galat });
        return;
      }
      foto = up.url ?? "";
    }
    const payload = {
      nama: fd.get("nama"),
      harga: fd.get("harga"),
      stok: fd.get("stok"),
      ambang: fd.get("ambang"),
      alias: fd.get("alias"),
      satuan: fd.get("satuan"),
      foto: foto || undefined,
    };
    const url = form.id
      ? `/api/proxy/agents/${agentId}/toko/produk/${form.id}`
      : `/api/proxy/agents/${agentId}/toko/produk`;
    const res = await fetch(url, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setPesan({ jenis: "galat", teks: body?.error ?? "Gagal menyimpan produk." });
      return;
    }
    setPesan({ jenis: "ok", teks: form.id ? "Produk diperbarui." : "Produk ditambahkan." });
    setForm(kosong);
    void muatUlang();
  }

  async function hapus(id: string, nama: string) {
    if (!window.confirm(`Hapus "${nama}" permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/proxy/agents/${agentId}/toko/produk/${id}/hapus-permanen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setPesan({ jenis: "galat", teks: body?.error ?? "Gagal menghapus produk." });
      return;
    }
    setPesan({ jenis: "ok", teks: "Produk dihapus." });
    void muatUlang();
  }

  const hasil = daftar.filter((p) => p.nama.toLowerCase().includes(cari.toLowerCase()));

  if (galatMuat) {
    return (
      <div className="galat">
        <h3>Tidak bisa memuat produk</h3>
        <p>{galatMuat}</p>
        <button className="btn btn-ghost" onClick={() => void muatUlang()}>
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="kartu">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
          {form.id ? "Ubah produk" : "Tambah produk"}
        </h2>
        <form className="baris-form" onSubmit={simpan} key={form.id ?? "baru"}>
          <label>
            Nama*
            <input className="rincian-input" name="nama" required maxLength={120} defaultValue={form.nama} />
          </label>
          <label>
            Harga (rupiah)*
            <input className="rincian-input" name="harga" type="number" min={0} required defaultValue={form.harga} />
          </label>
          <label>
            Stok*
            <input className="rincian-input" name="stok" type="number" min={0} required defaultValue={form.stok} />
          </label>
          <label>
            Ambang stok menipis
            <input className="rincian-input" name="ambang" type="number" min={0} defaultValue={form.ambang} />
          </label>
          <label>
            Kata kunci lain (pisah koma)
            <input className="rincian-input" name="alias" defaultValue={form.alias} />
          </label>
          <label>
            Satuan (nama: isi, koma)
            <input className="rincian-input" name="satuan" placeholder="renceng:10, dus:40" defaultValue={form.satuan} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Foto (PNG/JPG/WebP, maks 2 MB; unggah kembali bila ingin ganti)
            <input className="rincian-input" name="berkas" type="file" accept="image/png,image/jpeg,image/webp" />
            {form.foto && <span style={{ display: "block", marginTop: 4, fontWeight: 400 }}>Sudah ada: <a href={form.foto} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)" }}>lihat foto lama</a></span>}
          </label>
          <input type="hidden" name="foto" value={form.foto} />
          <div className="baris-aksi" style={{ gridColumn: "1 / -1", margin: 0 }}>
            <button className="btn" type="submit">
              {form.id ? "Simpan perubahan" : "Tambahkan"}
            </button>
            {form.id && (
              <button className="btn btn-ghost" type="button" onClick={() => setForm(kosong)}>
                Batal
              </button>
            )}
          </div>
        </form>
        {pesan && (
          <p
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 14,
              background: pesan.jenis === "ok" ? "var(--ok-soft)" : "var(--danger-soft)",
              color: pesan.jenis === "ok" ? "var(--ok-ink)" : "var(--danger-ink)",
            }}
          >
            {pesan.teks}
          </p>
        )}
      </section>

      <section>
        <input
          className="rincian-input"
          style={{ maxWidth: 280, marginBottom: 14 }}
          placeholder="Cari produk"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Cari produk"
        />
        {muat ? (
          <p style={{ color: "var(--muted)" }}>Memuat produk…</p>
        ) : hasil.length === 0 ? (
          <div className="kosong">
            <h3>Belum ada produk{cari ? " yang cocok." : "."}</h3>
          </div>
        ) : (
          <table className="tabel">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hasil.map((p) => (
                <tr key={p.id}>
                  <td>{p.foto && <img src={p.foto} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8, display: "inline", marginRight: 8 }} />}{p.nama}</td>
                  <td>{rp(p.harga)}</td>
                  <td>{p.stok}</td>
                  <td>
                    {p.aktif ? (
                      <span className="chip chip-ok">Aktif</span>
                    ) : (
                      <span className="chip chip-muted">Nonaktif</span>
                    )}
                    {p.stok <= p.ambang && p.aktif && <span className="chip chip-warn" style={{ marginLeft: 4 }}>Menipis</span>}
                  </td>
                  <td>
                    <div className="baris-aksi" style={{ margin: 0 }}>
                      <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13 }} onClick={() => setForm(bukaEdit(p))}>
                        Ubah
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "5px 12px", fontSize: 13 }}
                        onClick={async () => {
                          const res = await fetch(`/api/proxy/agents/${agentId}/toko/produk/${p.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ aktif: !p.aktif }),
                          });
                          if (!res.ok) {
                            const body = await res.json().catch(() => null);
                            setPesan({ jenis: "galat", teks: body?.error ?? "Gagal mengubah status." });
                            return;
                          }
                          void muatUlang();
                        }}
                      >
                        {p.aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 13, borderColor: "var(--danger)", color: "var(--danger-ink)" }} onClick={() => void hapus(p.id, p.nama)}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
