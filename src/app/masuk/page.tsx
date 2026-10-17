"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function HalamanMasuk() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setGalat("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/toko-saya");
        return;
      }
      const body = await res.json().catch(() => null);
      setGalat(body?.error?.message ?? "Masalah ke server. Coba lagi nanti.");
    } catch {
      setGalat("Masalah ke server. Coba lagi nanti.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={kirim} style={{ width: 360, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }} noValidate>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Masuk</h1>
        <p style={{ color: "var(--muted)", marginBottom: 20 }}>Wajib untuk seller dan admin.</p>
        <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rincian-input"
            style={{ marginTop: 4 }}
            autoComplete="email"
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
            autoComplete="current-password"
          />
        </label>
        {galat && (
          <p style={{ color: "var(--danger-ink)", background: "var(--danger-soft)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 14 }}>
            {galat}
          </p>
        )}
        <button className="btn" type="submit" disabled={sibuk || !email || !password} style={{ width: "100%" }}>
          {sibuk ? "Memproses…" : "Masuk"}
        </button>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 14, textAlign: "center" }}>
          Belum punya akun? <Link href="/" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>Kembali ke Tokowa</Link>
        </p>
      </form>
    </main>
  );
}
