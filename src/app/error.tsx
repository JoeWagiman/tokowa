"use client";

export default function Galat({ reset }: { error: unknown; reset: () => void }) {
  return (
    <main className="galat">
      <h3>Ada gangguan</h3>
      <p>Gagal memuat halaman. Coba lagi.</p>
      <button className="btn" onClick={reset}>
        Coba lagi
      </button>
    </main>
  );
}
