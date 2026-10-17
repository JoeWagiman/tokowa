# Tokowa.app

Marketplace lokal satu pintu untuk belanja dan berjualan lewat chat WhatsApp.
Pembeli bertransaksi di chat, dicocokkan ke seller terdekat, lalu memilih
pemenuhan: diantar kurir instan, diantar penjual, atau diambil sendiri di tempat
seller.

Repo ini adalah **frontend** yang memanggil API backend obrool. Backend
(agent, WABA, pembayaran, logistik) tetap berada di proyek obrool.

> Status: tahap desain UI. Deliverable saat ini adalah sumber desain
> `model.pen` dan arah brand `DESIGN.md`.

## Dokumen

- `DESIGN.md` — arah brand, palet, tipografi, dial, motif, aturan pemenuhan &
  akun pembeli.
- `AGENTS.md` — panduan agen coding (termasuk pointer antislop).
- `.env.example` — nama variabel environment (tanpa nilai secret).

## Aturan produk penting

- Belanja inti lewat WABA pada satu nomor platform, bot routing ke seller
  terdekat.
- Tiga opsi pemenuhan: kurir instan (Gosend/Grab, dispatch placeholder dulu),
  diantar penjual, atau ambil di seller.
- Pesanan lunas + ongkir boleh tanpa akun. **COD wajib akun + KYC.**
- KYC seller: manual (KTP + selfie + rekening) untuk sekarang, provider e-KYC
  menyusul.
- Dua bahasa: Indonesia (default) dan Inggris.

## Gap backend yang perlu dibangun di obrool

KYC seller, marketplace produk multi-tenant, pencocokan seller terdekat (geo +
radius), bot routing satu nomor WABA lintas seller, dispatch kurir instan, dan
split pembayaran per seller. Desain UI bisa maju sebelum ini ada; implementasi
menunggu kontrak API.
