# Kontrak API Tokowa ↔ obrool

Status: **F1–F3 terimplementasi dan sudah lewat uji ujung ke ujung di branch
dev obrool.** F4 baru sebagian: pelacakan pesanan pembeli sudah jalan.
Sisanya (quote, buat pesanan, pengecualian status, passthrough WABA) masih
rencana. Dokumen ini mencatat endpoint yang benar-benar ada di kode obrool
(`D:\Project\obrool`), bukan usulan lagi.

Aturan yang mengikat adalah pembagian tanggung jawab dan nama endpoint. Field
yang kontraknya belum stabil ditandai eksplisit.

## 1. Prinsip pembagian

| Kebutuhan | Pemilik | Catatan |
|---|---|---|
| Agent AI (WABA bot, pencocokan produk ke penjual, orkestrasi pesanan) | **obrool** | Satu nomor WABA platform Tokowa, di-route ke agent obrool |
| Data domain: produk multi-penjual, pesanan, stok, ledger, retur, setting toko | **obrool** | Model `Toko*` yang sudah ada, tenant per `Agent` |
| KYC penjual dan antrean verifikasi admin | **obrool** (satu backend) | Tokowa hanya UI upload dan review; keputusan tetap di obrool |
| Discovery storefront web (katalog, toko, produk) | **obrool** | Endpoint `v1/catalog/*` publik read-only |
| Sesi web, form, render UI | **Tokowa.app** (BFF tipis) | Route handler memanggil obrool; tidak menyimpan data domain |

Aturan tegas: **Tokowa.app punya nol logika domain.** BFF hanya auth, validasi
format, transformasi tampilan, dan proxy.

## 2. Konvensi nyata

- **Endpoint obrool hari ini ada di dua keluarga:**
  - `v1/*` (baru, dipakai F2/F3 untuk KYC, katalog, pesanan, admin).
  - `/api/agents/*`, `/api/auth/*` (lama, dipakai untuk produk, setting toko,
    dan login). Ini bukan prefiks yang ideal, tapi inilah yang berjalan.
- **Base URL:** belum ada subdomain publik. Di dev, obrool jalan di
  `http://localhost:3002` dan Tokowa menembaknya lewat BFF.
- **Auth:** `POST /api/auth/login` mengembalikan `{message, token, user:{id,email,name,role}}`
  dan sekaligus men-set cookie `obrool_token`. Role yang dipakai hari ini:
  `admin`, `cs`, dan role pengguna biasa untuk penjual.
  - Tokowa menyimpan token di cookie httpOnly `tokowa_token` lewat `/api/session`,
    lalu BFF `/api/proxy/[...path]` menempelkannya sebagai `Authorization: Bearer`.
  - Semua mutasi Tokowa lewat BFF. Tidak ada token di browser.
- **Envelope:** endpoint `v1/*` memakai `{"data": ...}`. Gagal selalu
  `{"error": {"code", "message"}}`. Endpoint lama (`/api/agents/*`) mengembalikan
  objek telanjang (`{produk, total, limit, offset}`, `{ok, nama}`) dan `{error: "teks"}`.
  Ini tidak konsisten; normalisasi ditunda sampai F4.
- Angka uang integer rupiah. Waktu ISO 8601 UTC.
- Cursor: `?cursor=&limit=`, respons `{"data": {"items": [...], "nextCursor": "..."|null}}`.

## 3. Entitas nyata

### SellerKYC (`prisma/schema.prisma`, model `SellerKYC`)
`{id, userId (unique), agentId?, namaLegal, namaToko?, alamat, noKtp, fotoKtp,
noNpwp?, fotoNpwp?, bankName, noRekening, namaRekening, status, catatan?,
reviewerId?, decidedAt?, createdAt, updatedAt}`
- `status`: `menunggu` (default), `diterima`, `ditolak`.
- `catatan` hanya diisi saat `ditolak`.
- Satu KYC per user (upsert), bukan per attempt. Kirim ulang saat sudah
  `diterima` ditolak dengan `409 already_verified`.
- **Tabel `SellerKYC` baru ada di branch dev obrool.** Push ke produksi bersifat
  additive dan belum dilakukan.

### Produk (model `TokoProduk`, tenant = `Agent`)
`{id, agentId, nama, alias (JSON string), harga, stok, satuan (JSON string),
ambang, foto?, aktif, createdAt, updatedAt}`
- 1 produk = 1 penjual. Pencocokan bot hanya menyarankan produk yang stoknya ada.

### Setting toko (model `TokoSetting`, per `agentId`)
Field yang dipakai UI: `jamBuka`/`jamTutup` (`HH:MM`), `hariBuka` (CSV `0-6`),
`jendelaReturHari` (0-30), `ongkirRetur` (`pembeli|toko|bagi_dua`),
`qrisStatisNama`, `qrisStatisUrl`.

### Pesanan (model `TokoPesanan`)
Status: `draf | tunggu_bayar | tunggu_verifikasi | paid | kirim | selesai | batal`.
Status `paid` hanya dari webhook pembayaran atau aksi seller `konfirmasi`, tidak
pernah dari janji chat.

## 4. Endpoint yang sudah jalan

### 4.1 Auth (BFF Tokowa)
- `POST /api/session` (Tokowa) menerima `{email, password}`, memanggil
  `POST /api/auth/login` obrool, menyimpan cookie `tokowa_token`.
- `DELETE /api/session` (Tokowa) → logout.

### 4.2 Katalog (publik, tanpa auth)
- `GET /api/v1/catalog?q=&kota=&cursor=&limit=` (limit maks 60)
  → `{data:{items:[{id,nama,foto,harga,stok,ambang,satuan[],agentId,toko,pemilik}],nextCursor}}`
- `GET /api/v1/catalog/products/{id}` → detail + meta penjual.
- `GET /api/v1/catalog/stores/{agentId}` → profil toko + produk aktifnya.

### 4.3 Penjual: KYC (auth user)
- `GET /api/v1/seller/kyc` → `{data: {id, namaLegal, namaToko, status, catatan, decidedAt, updatedAt} | null}`
- `POST /api/v1/seller/kyc` → body `{namaLegal, alamat, noKtp, fotoKtp, bankName,
  noRekening, namaRekening, namaToko?, noNpwp?, fotoNpwp?, agentId?}`.
  Wajib: namaLegal, alamat, noKtp, fotoKtp, bankName, noRekening, namaRekening.
  Nomor NPWP tanpa foto NPWP ditolak. Status selalu direset ke `menunggu`.
- `POST /api/v1/seller/kyc/file` (multipart, field `file`) → `{data:{url}}`.
  PNG/JPG/WebP, maks 5 MB, butuh R2 terkonfigurasi (kalau tidak, `503`).

### 4.4 Penjual: produk (auth user, lewat agent)
- `GET /api/agents/{agentId}/toko/produk?limit=&offset=` → `{produk[], total, limit, offset}`
- `POST /api/agents/{agentId}/toko/produk` → buat produk.
- `PATCH /api/agents/{agentId}/toko/produk/{produkId}` → update parsial
  (termasuk `aktif: false` untuk nonaktifkan). **Bukan PUT.**
- `DELETE /api/agents/{agentId}/toko/produk/{produkId}` → hapus lunak.
- `POST /api/agents/{agentId}/toko/produk/{produkId}/hapus-permanen` →
  body `{nama}`, nilai harus sama dengan nama produk (case-insensitive).
  Ditolak bila produk masih dirujuk pesanan.
  → `{ok:true, nama}`.

### 4.5 Penjual: setting toko (auth user)
- `GET`/`POST /api/agents/{agentId}/toko/setting` → baca/tulis setting.
- `POST /api/agents/{agentId}/toko/foto` (multipart) → foto toko lewat R2.

### 4.6 Penjual: pesanan (auth user)
- `GET /api/v1/seller/pesanan?agentId=&status=&cursor=&limit=` (limit maks 50)
  → hanya pesanan milik agent user; default mengembalikan semua status kecuali `draf`.
  Ringkasan per item: `{id,total,status,metodeBayar,adaBukti,pelanggan,jumlahItem,agentId,createdAt,updatedAt}`.
- `GET /api/v1/seller/pesanan/{id}` → detail.
- `POST /api/v1/seller/pesanan/{id}/aksi` → body `{aksi}`. Aturan transisi:
  | aksi | dari | hasil |
  |---|---|---|
  | `konfirmasi` | `tunggu_verifikasi` | `paid` |
  | `tolak` | `tunggu_verifikasi` | `batal` |
  | `kirim` | `paid` | `kirim` |
  | `selesai` | `kirim` | `selesai` |
  | `batal` | `tunggu_bayar`, `tunggu_verifikasi` | `batal` |
  Transisi tidak valid dibalas `409` dengan pesan Indonesia.

### 4.7 Admin (auth role admin)
- `GET /api/v1/admin/kyc?status=` (`status=semua` untuk semua, default `menunggu`)
  → `{data:{items:[...KYC + user{name,email}]}}`
- `POST /api/v1/admin/kyc/{id}/decide` → body **`{keputusan: "diterima"|"ditolak", catatan}`**.
  `catatan` wajib saat `ditolak`. Field-nya `keputusan`, bukan `status`.
  KYC yang sudah `diterima` dibalas `409`.
- `GET /api/v1/admin/sellers?q=` → daftar agent dengan
  `{agentId,nama,email,pemilik,statusKyc,catatan,jumlahProduk,createdAt}`.

### 4.8 Pelacakan pesanan pembeli (publik, tanpa auth)
- `GET /api/v1/pesanan/lacak?kode=&hp=` di obrool. `kode` adalah 6 huruf terakhir
  id pesanan (sama dengan kode di chat) atau id penuh. `hp` adalah 4 angka
  terakhir nomor WhatsApp pembeli. Rate limit 12 percobaan per menit per IP+kode.
  - Cocok → `{data: {id, kode, toko, status, statusLabel, total, metodeBayar,
    pelangganMask, items[], langkah[{status,label,keadaan}], bayar, dibuatAt, diperbaruiAt}}`.
  - Tidak cocok → `404 not_found` dengan pesan yang tidak membocorkan apakah
    pesanan ada. Kode salah format → `400`.
  - Nomor pembeli dikembalikan termask (`••••6789`). Bukti bayar dan paylink tidak
    ikut dibuka.
  - `bayar` hanya diisi saat status `tunggu_bayar`/`tunggu_verifikasi`, berisi
    `{metode, qrisNama, qrisUrl}` dari `TokoSetting` toko (bisa `null` bila toko
    belum memasang QRIS).
- Tokowa: `GET /api/lacak` (BFF publik tanpa token) + halaman `/lacak`
  (`?kode=` boleh dikirim di tautan WhatsApp untuk mengisi otomatis).

## 5. Keputusan yang sudah dikunci

- **KYC satu backend.** Tidak ada state KYC yang disimpan di Tokowa; antrean
  admin di Tokowa adalah tampilan langsung dari obrool.
- **Webhook `kyc.decided` dibatalkan** untuk F3. Antrean admin cukup menarik
  ulang data (pull). Webhook outbound ditunda; lihat bagian 7.
- **Hapus permanen produk butuh konfirmasi nama.** Ini bertahan sebagai
  pengaman, dan UI Tokowa memintanya.
- **Pembayaran pesanan web: QRIS statis toko + verifikasi seller.** Tidak pakai
  paylink iPaymu untuk jalur ini. Pembeli membayar ke QRIS toko, seller
  memverifikasi lewat aksi `konfirmasi` (`tunggu_verifikasi` → `paid`).
- **Pelacakan pembeli butuh kode pesanan + 4 angka terakhir nomor WA.** Bukan
  id saja, supaya tautan yang tersebar tidak membuka isi pesanan orang lain.
- **WA number belum diatur.** Semua tombol WhatsApp nonaktif dengan
  `title="Nomor WhatsApp belum diatur"`. Ini keadaan yang disengaja, bukan bug.

## 6. F4 (belum ada di kode)

1. **Chat WABA sebagai jalur belanja.** Nomor WABA platform → webhook Meta →
   agent obrool. Tokowa tidak di jalur chat. Dua opsi: obrool memasang webhook
   sendiri, atau Tokowa hanya pass-through tanpa mengubah body.
2. **Quote dan pesanan web.** `POST /orders/quote` dengan tiga mode
   (`courier_instant | seller_delivery | self_pickup`), `POST /orders` dengan
   idempotency, lalu `GET /orders/{id}`. `courier_instant` masih butuh sumber
   estimasi ongkir kurir yang belum ada di obrool.
3. **Pengecualian status.** Pembatalan pembeli, sengketa, dan retur
   (`TokoRetur` sudah ada di schema) perlu endpoint dan UI.
4. **Webhook balik obrool → Tokowa** untuk `order.status_changed` dan
   `dispute.decided`, signed HMAC, kalau polling mulai berat.

Sudah selesai lebih dulu: **pelacakan pesanan pembeli** (bagian 4.8), read-only,
tanpa menyentuh uang.

## 7. Masih terbuka

- Media storage: satu bucket R2 untuk produk dan KYC (mempengaruhi alur upload)?
- Sumber estimasi ongkir untuk mode `courier_instant`.
- Normalisasi endpoint: kapan `/api/agents/*` pindah ke `v1/*` dan envelope
  diseragamkan ke `{data}`.
- Idempotency window untuk `POST /orders` (usulan 24 jam).
- `message` error: tetap Indonesia + `code` stabil seperti sekarang, atau
  Tokowa melakukan i18n sendiri dari `code`.

## 8. Riwayat koreksi kontrak

Kesalahan yang sudah ditemukan dan diperbaiki di kode, dicatat supaya tidak
terulang:

| Salah | Benar |
|---|---|
| Update produk `PUT` | `PATCH` (parsial) |
| Hapus permanen tanpa syarat | `POST .../hapus-permanen` body `{nama}` harus cocok |
| Decide KYC body `{status}` | `{keputusan: "diterima"|"ditolak", catatan}` |
| Proxy Tokowa meneruskan `/v1/...` | obrool butuh prefiks `/api`, jadi BFF menempel `/api` |
| `export const GET = core` di route handler | Next 16.3.1 butuh `export async function GET` |
