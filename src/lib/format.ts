export const rp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export type StokStatus = "habis" | "menipis" | "ada";

export function stokStatus(stok: number, ambang: number): StokStatus {
  if (stok <= 0) return "habis";
  if (stok <= ambang) return "menipis";
  return "ada";
}

export const stokLabel: Record<StokStatus, string> = {
  habis: "Stok habis",
  menipis: "Stok menipis",
  ada: "Tersedia",
};
