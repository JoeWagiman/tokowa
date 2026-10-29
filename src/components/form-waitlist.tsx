"use client";

import { useState } from "react";

export function FormWaitlist() {
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [minat, setMinat] = useState("");
  const [galat, setGalat] = useState("");
  const [selesai, setSelesai] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setGalat("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, whatsapp, email, minat }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGalat(body?.error?.message ?? "Gagal menyimpan. Coba lagi nanti.");
        return;
      }
      setSelesai(true);
    } catch {
      setGalat("Tidak bisa menghubungi server. Coba lagi nanti.");
    } finally {
      setSibuk(false);
    }
  }

  if (selesai) {
    return (
      <div className="kosong" role="status">
        <h3>Kamu masuk daftar tunggu.</h3>
        <p>Kami menghubungimu lewat WhatsApp saat giliranmu tiba. Simpan nomor Tokowa agar pesannya tidak tenggelam.</p>
      </div>
    );
  }

  return (
    <form onSubmit={kirim} noValidate>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12, textAlign: "left" }}>
        Nama
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="rincian-input"
          style={{ marginTop: 4 }}
          autoComplete="name"
          maxLength={80}
          required
        />
      </label>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12, textAlign: "left" }}>
        Nomor WhatsApp
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="rincian-input"
          style={{ marginTop: 4 }}
          inputMode="tel"
          autoComplete="tel"
          placeholder="081234567890"
          maxLength={20}
          required
        />
      </label>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 16, textAlign: "left" }}>
        Email (opsional)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rincian-input"
          style={{ marginTop: 4 }}
          autoComplete="email"
        />
      </label>
      <fieldset className="pilihan-kirim" style={{ marginBottom: 16 }}>
        <legend>Minat kamu</legend>
        {[
          { nilai: "penjual", label: "Jadi penjual" },
          { nilai: "pembeli", label: "Jadi pembeli" },
          { nilai: "coba", label: "Coba-coba saja" },
        ].map((p) => (
          <label key={p.nilai} className={minat === p.nilai ? "pill aktif" : "pill"}>
            <input
              type="radio"
              name="minat"
              value={p.nilai}
              checked={minat === p.nilai}
              onChange={() => setMinat(p.nilai)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>
      {galat && (
        <p role="alert" style={{ color: "var(--danger-ink)", background: "var(--danger-soft)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 14 }}>
          {galat}
        </p>
      )}
      <button className="btn" type="submit" disabled={sibuk || !minat} style={{ width: "100%" }} aria-busy={sibuk}>
        {sibuk ? "Menyimpan…" : "Gabung waitlist"}
      </button>
    </form>
  );
}
