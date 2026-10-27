"use client";

import type { LokasiPembeli } from "@/lib/pesan-klien";

export function BlokLokasi({
  lokasi,
  status,
  onMinta,
}: {
  lokasi: LokasiPembeli | null;
  status: "idle" | "meminta" | "dapat" | "gagal";
  onMinta: () => void;
}) {
  return (
    <div>
      <button className="btn btn-ghost" type="button" onClick={onMinta} disabled={status === "meminta"}>
        {status === "meminta" ? "Mengambil lokasi" : lokasi ? "Perbarui lokasi" : "Pakai lokasi saya"}
      </button>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }} aria-live="polite">
        {status === "dapat" && lokasi
          ? `Titik tercatat. Ongkir dihitung dari jarak titik ini ke toko.`
          : status === "gagal"
            ? "Lokasi tidak didapat. Izinkan akses lokasi di browser, atau pesan lewat WhatsApp."
            : "Ongkir kurir instan dihitung dari jarak titik lokasimu ke toko."}
      </p>
    </div>
  );
}
