"use client";

import Link from "next/link";
import { useState } from "react";

export function FormDaftar() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [galat, setGalat] = useState("");
  const [selesai, setSelesai] = useState("");
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setGalat("");
    try {
      const res = await fetch("/api/session/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setGalat(body?.error?.message ?? "Pendaftaran gagal. Periksa data lalu coba lagi.");
        return;
      }
      setSelesai(body?.data?.message ?? "Pendaftaran berhasil. Periksa email untuk verifikasi sebelum masuk.");
      setPassword("");
    } catch {
      setGalat("Masalah ke server. Coba lagi nanti.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <form onSubmit={kirim} style={{ width: "min(380px, 100%)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }} noValidate>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Daftar jadi penjual</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20 }}>
        Satu akun untuk membuka toko, mengatur produk, dan menerima pesanan.
      </p>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        Nama
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="rincian-input"
          style={{ marginTop: 4 }}
          autoComplete="name"
          required
        />
      </label>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rincian-input"
          style={{ marginTop: 4 }}
          autoComplete="email"
          required
        />
      </label>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rincian-input"
          style={{ marginTop: 4 }}
          autoComplete="new-password"
          required
        />
      </label>
      {galat && (
        <p style={{ color: "var(--danger-ink)", background: "var(--danger-soft)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 14 }}>
          {galat}
        </p>
      )}
      {selesai && (
        <p style={{ color: "var(--ok-ink)", background: "var(--ok-soft)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 14 }}>
          {selesai}{" "}
          <Link href="/masuk" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
            Masuk sekarang
          </Link>
        </p>
      )}
      <button className="btn" type="submit" disabled={sibuk || !nama || !email || !password} style={{ width: "100%" }}>
        {sibuk ? "Memproses…" : "Buat akun penjual"}
      </button>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 14, textAlign: "center" }}>
        Sudah punya akun? <Link href="/masuk" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Masuk</Link>
      </p>
    </form>
  );
}
