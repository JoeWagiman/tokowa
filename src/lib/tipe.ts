type Satuan = { nama: string; isi: number };
type Baris = { id: string; nama: string; foto: string; harga: number; stok: number; ambang: number; satuan: Satuan[]; agentId: string; toko: string; pemilik: string | null; wabaSendiri: boolean; nomorJualan: string | null };

export type ProdukCard = Baris;
export type DaftarProduk = { items: Baris[]; nextCursor: string | null };
export type ProdukDetail = { jamOperasional: { buka: string; tutup: string } | null } & Baris;
export type InfoToko = { agentId: string; nama: string; pemilik: string | null; wabaSendiri: boolean; nomorJualan: string | null; jamOperasional: { buka: string; tutup: string; hari: string[] | null } | null; items: Omit<Baris, "agentId" | "toko" | "pemilik">[] };

export type LacakLangkah = { status: string; label: string; keadaan: "selesai" | "kini" | "menunggu" };

export type LacakRetur = {
  kode: string;
  status: string;
  statusLabel: string;
  alasan: string;
  alasanLabel: string;
  refundTotal: number;
  refundCatatan: string | null;
  dibuatAt: string;
  diperbaruiAt: string;
};

export type LacakSengketa = {
  kode: string;
  status: string;
  statusLabel: string;
  batasTokoAt: string | null;
  alasanTolakToko: string | null;
  putusan: string | null;
  putusanLabel: string | null;
  refundTotal: number;
  catatanPutusan: string | null;
  dibuatAt: string;
  diperbaruiAt: string;
};

export type LacakPesanan = {
  id: string;
  kode: string;
  toko: string;
  status: string;
  statusLabel: string;
  total: number;
  metodeBayar: string | null;
  pelangganMask: string | null;
  items: { nama: string; qty: number; satuan: string; harga: number }[];
  langkah: LacakLangkah[];
  pengiriman: { mode: string; ongkir: number; alamat: string | null } | null;
  bayar: { metode: string | null; qrisNama: string | null; qrisUrl: string | null } | null;
  bisaBatal: boolean;
  bisaRetur: boolean;
  bisaSengketa: boolean;
  sengketa: LacakSengketa | null;
  jendelaReturHari: number;
  ongkirRetur: string;
  retur: LacakRetur | null;
  dibuatAt: string;
  diperbaruiAt: string;
};

export type AlasanRetur = { nilai: string; label: string };
