export type ItemKeranjang = {
  produkId: string;
  agentId: string;
  toko: string;
  nama: string;
  harga: number;
  satuan: string;
  stok: number;
  qty: number;
};

const KUNCI = "tokowa-keranjang-v1";
const EVENT = "tokowa-keranjang";

export const MAKS_QTY_KERANJANG = 99;

export function bacaKeranjang(): ItemKeranjang[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(window.localStorage.getItem(KUNCI) ?? "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is ItemKeranjang =>
        Boolean(x) &&
        typeof x.produkId === "string" &&
        typeof x.agentId === "string" &&
        typeof x.nama === "string" &&
        Number.isFinite(x.qty) &&
        Number.isFinite(x.harga)
    );
  } catch {
    return [];
  }
}

function simpan(items: ItemKeranjang[]) {
  try {
    window.localStorage.setItem(KUNCI, JSON.stringify(items));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

export function langganKeranjang(panggil: () => void): () => void {
  window.addEventListener(EVENT, panggil);
  window.addEventListener("storage", panggil);
  return () => {
    window.removeEventListener(EVENT, panggil);
    window.removeEventListener("storage", panggil);
  };
}

export function jumlahKeranjang(items: ItemKeranjang[]): number {
  return items.reduce((a, x) => a + x.qty, 0);
}

export type HasilTambah = { ok: true; jumlah: number } | { ok: false; toko: string };

export function tambahKeranjang(item: Omit<ItemKeranjang, "qty">, qty: number): HasilTambah {
  const items = bacaKeranjang();
  if (items.length > 0 && items[0].agentId !== item.agentId) {
    return { ok: false, toko: items[0].toko };
  }
  const batas = Math.max(1, Math.min(MAKS_QTY_KERANJANG, item.stok));
  const ada = items.find((x) => x.produkId === item.produkId);
  if (ada) {
    ada.qty = Math.min(batas, ada.qty + qty);
    ada.stok = item.stok;
    ada.harga = item.harga;
    ada.satuan = item.satuan;
  } else {
    items.push({ ...item, qty: Math.max(1, Math.min(batas, qty)) });
  }
  simpan(items);
  return { ok: true, jumlah: jumlahKeranjang(items) };
}

export function ubahQtyKeranjang(produkId: string, qty: number): ItemKeranjang[] {
  const items = bacaKeranjang().map((x) => {
    if (x.produkId !== produkId) return x;
    const batas = Math.max(1, Math.min(MAKS_QTY_KERANJANG, x.stok));
    return { ...x, qty: Math.max(1, Math.min(batas, Math.floor(qty) || 1)) };
  });
  simpan(items);
  return items;
}

export function hapusKeranjang(produkId: string): ItemKeranjang[] {
  const items = bacaKeranjang().filter((x) => x.produkId !== produkId);
  simpan(items);
  return items;
}

export function kosongkanKeranjang(): void {
  simpan([]);
}
