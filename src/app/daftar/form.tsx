"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Awal = {
  status: string | null;
  catatan: string | null;
  namaLegal: string | null;
};

const kirimJSON = async (url: string, metode: string, isi: unknown) => {
  const res = await fetch(url, {
    method: metode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isi),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? body?.error ?? "Gagal menyimpan.");
  return body;
};

export function FormKyc({ awal, r2Idup }: { awal: Awal; r2Idup: boolean }) {
  const router = useRouter();
  const [urlKtp, setUrlKtp] = useState("");
  const [urlNpwp, setUrlNpwp] = useState("");
  const [unggah, setUnggah] = useState("");
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function unggahDok(e: React.ChangeEvent<HTMLInputElement>, tujuan: "ktp" | "npwp") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUnggah("Ukuran gambar melebihi 5 MB. Kecilkan dulu lalu unggah ulang.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUnggah("Mengunggah…");
    try {
      const res = await fetch("/api/proxy/v1/seller/kyc/file", { method: "POST", body: fd });
      const body = await res.json().catch(() => null);
      if (!res.ok || (!body?.data?.key && !body?.data?.url)) {
        setUnggah(body?.error?.message ?? body?.error ?? "Unggahan gagal.");
        return;
      }
      if (tujuan === "ktp") setUrlKtp(body.data.key ?? body.data.url);
      else setUrlNpwp(body.data.key ?? body.data.url);
      setUnggah(tujuan === "ktp" ? "Foto KTP terunggah." : "Foto NPWP terunggah.");
    } catch {
      setUnggah("Masalah ke server. Coba lagi nanti.");
    }
  }

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    setPesan(null);
    setSibuk(true);
    try {
      if (!urlKtp) {
        setPesan({ jenis: "galat", teks: "Foto KTP belum terunggah." });
        return;
      }
      await kirimJSON("/api/proxy/v1/seller/kyc", "POST", {
        namaLegal: get("namaLegal"),
        namaToko: get("namaToko") || undefined,
        alamat: get("alamat"),
        noKtp: get("noKtp"),
        fotoKtp: urlKtp,
        noNpwp: get("noNpwp") || undefined,
        fotoNpwp: urlNpwp || undefined,
        bankName: get("bankName"),
        noRekening: get("noRekening"),
        namaRekening: get("namaRekening"),
      });
      setPesan({ jenis: "ok", teks: "Pengajuan terkirim." });
      router.push("/verifikasi");
    } catch (err) {
      setPesan({ jenis: "galat", teks: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSibuk(false);
    }
  }

  if (awal.status === "diterima") {
    return (
      <div className="ketemu">
        <div className="kosong">
          <h3>Tokomu sudah terverifikasi.</h3>
          <p>Toko tampil di katalog umum Tokowa.</p>
          <a className="btn" href="/toko-saya">Kembali ke toko</a>
        </div>
      </div>
    );
  }

  return (
    <form className="kartu" onSubmit={kirim} style={{ display: "grid", gap: 18, maxWidth: 640 }}>
      {awal.status === "ditolak" && awal.catatan && (
        <p style={{ background: "var(--danger-soft)", color: "var(--danger-ink)", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}>
          Pengajuan sebelumnya ditolak. Alasan: {awal.catatan}
        </p>
      )}

      <p style={{ fontSize: 14, color: "var(--muted)" }}>
        Data hanya dilihat tim verifikasi, dan verifikasi selesai [perkiraan waktu]. Tanda * wajib.
      </p>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Identitas usaha</h2>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
          Nama legal usaha*
          <input className="rincian-input" name="namaLegal" required defaultValue={awal.namaLegal ?? ""} style={{ marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
          Nama toko yang ditampilkan
          <input className="rincian-input" name="namaToko" style={{ marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
          Alamat usaha*
          <textarea className="rincian-input" name="alamat" required rows={2} style={{ marginTop: 4 }} />
        </label>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Dokumen</h2>
        <div className="baris-form" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Nomor KTP*
            <input className="rincian-input" name="noKtp" required inputMode="numeric" style={{ marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Foto KTP* (PNG/JPG/WebP, maks 5 MB)
            <input
              className="rincian-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void unggahDok(e, "ktp")}
            />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Nomor NPWP (opsional)
            <input className="rincian-input" name="noNpwp" style={{ marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Foto NPWP (wajib bila nomor diisi)
            <input
              className="rincian-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void unggahDok(e, "npwp")}
            />
          </label>
        </div>
        {unggah && <p style={{ fontSize: 13, color: "var(--muted)" }}>{unggah}</p>}
        {urlKtp && <p style={{ fontSize: 13, color: "var(--ok-ink)" }}>Foto KTP: {urlKtp.slice(0, 60)}…</p>}
        {urlNpwp && <p style={{ fontSize: 13, color: "var(--ok-ink)" }}>Foto NPWP: {urlNpwp.slice(0, 60)}…</p>}
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Rekening untuk pembayaran</h2>
        <div className="baris-form">
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Nama bank*
            <input className="rincian-input" name="bankName" required style={{ marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Nomor rekening*
            <input className="rincian-input" name="noRekening" required inputMode="numeric" style={{ marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
            Nama di rekening*
            <input className="rincian-input" name="namaRekening" required style={{ marginTop: 4 }} />
          </label>
        </div>
      </section>

      {pesan && (
        <p
          style={{
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

      <div className="baris-aksi" style={{ margin: 0 }}>
        <button className="btn" type="submit" disabled={sibuk}>
          {sibuk ? "Mengirim…" : awal.status === "ditolak" ? "Kirim ulang" : "Kirim verifikasi"}
        </button>
        <a className="btn btn-ghost" href="/verifikasi">
          Lihat status
        </a>
      </div>
    </form>
  );
}
