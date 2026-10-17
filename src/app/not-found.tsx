import Link from "next/link";

export default function TidakKetemu() {
  return (
    <main className="notfound">
      <h1>Tidak ketemu</h1>
      <p>Halaman yang kamu cari tidak ada atau sudah pindah.</p>
      <Link className="btn" href="/">
        Kembali
      </Link>
    </main>
  );
}
