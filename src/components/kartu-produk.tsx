import Link from "next/link";
import type { ProdukCard } from "@/lib/tipe";
import { rp, stokStatus, stokLabel, type StokStatus } from "@/lib/format";

const chipKelas: Record<StokStatus, string> = {
  habis: "chip chip-muted",
  menipis: "chip chip-warn",
  ada: "chip chip-ok",
};

export function KartuProduk({ p }: { p: ProdukCard }) {
  const s = stokStatus(p.stok, p.ambang);
  return (
    <Link className="prod-card" href={`/produk/${p.id}`}>
      {p.foto ? (
        <img className="prod-th" src={p.foto} alt="" loading="lazy" />
      ) : (
        <div className="prod-th is-blank">
          <span>[foto produk]</span>
        </div>
      )}
      <div className="prod-body">
        <div className="prod-nama">{p.nama}</div>
        <div className="prod-toko">{p.toko}</div>
        <div className="prod-bottom">
          <span className="prod-harga">{rp(p.harga)}</span>
          <span className={chipKelas[s]}>{stokLabel[s]}</span>
        </div>
      </div>
    </Link>
  );
}
