type Satuan = { nama: string; isi: number };
type Baris = { id: string; nama: string; foto: string; harga: number; stok: number; ambang: number; satuan: Satuan[]; agentId: string; toko: string; pemilik: string | null };

export type ProdukCard = Baris;
export type DaftarProduk = { items: Baris[]; nextCursor: string | null };
export type ProdukDetail = { jamOperasional: { buka: string; tutup: string } | null } & Baris;
export type InfoToko = { agentId: string; nama: string; pemilik: string | null; jamOperasional: { buka: string; tutup: string; hari: string[] | null } | null; items: Omit<Baris, "agentId" | "toko" | "pemilik">[] };
