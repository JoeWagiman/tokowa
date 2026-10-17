"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bacaKeranjang, jumlahKeranjang, langganKeranjang } from "@/lib/keranjang";

export function PenandaKeranjang() {
  const [jumlah, setJumlah] = useState(0);

  useEffect(() => {
    const segarkan = () => setJumlah(jumlahKeranjang(bacaKeranjang()));
    segarkan();
    return langganKeranjang(segarkan);
  }, []);

  return (
    <Link href="/keranjang" className="keranjang" aria-label={`Keranjang, ${jumlah} barang`}>
      Keranjang
      {jumlah > 0 && <span className="jumlah">{jumlah}</span>}
    </Link>
  );
}
