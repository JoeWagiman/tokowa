# Kontrak API Tokowa ↔ obrool

Status: **F1–F3 terimplementasi dan sudah lewat uji ujung ke ujung di branch
dev obrool.** F4 selesai: pelacakan pesanan pembeli (4.8), pemesanan web
quote + buat pesanan (4.9), keranjang multi-produk, pembatalan + retur (4.11),
webhook balik (4.12), chat WABA (4.13), dan tarif `courier_instant` (4.9).
Yang terbuka kini bahan lanjutan bagian 7.
Dokumen ini mencatat endpoint yang benar-benar
ada di kode obrool (`D:\Project\obrool`), bukan usulan lagi.

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
`qrisStatisNama`, `qrisStatisUrl`, `ongkirSellerFlat`,
`kurirInstanDasar`/`kurirInstanPerKm`/`kurirInstanJarakMaksKm` (tarif kurir
instan, bagian 4.9), `lat`/`lng` (titik toko).

### Pesanan (model `TokoPesanan`)
Status: `draf | tunggu_bayar | tunggu_verifikasi | paid | kirim | selesai | batal`.
Status `paid` hanya dari webhook pembayaran atau aksi seller `konfirmasi`, tidak
pernah dari janji chat.

## 4. Endpoint yang sudah jalan

### 4.1 Auth dan onboarding penjual (BFF Tokowa)
- Mode waitlist dikontrol `NEXT_PUBLIC_WAITLIST_MODE` (`"true"` default).
  Mode waitlist: halaman `/masuk` dan `/daftar-akun` menampilkan form
  waitlist (nama + nomor WhatsApp + email opsional) yang dikirim ke
  `POST /api/waitlist`. BFF memvalidasi lalu meneruskan ke
  `WAITLIST_FORWARD_URL` (endpoint eksternal); kosong berarti pendaftaran belum
  dibuka (`503` dengan pesan jujur).
- Mode terbuka (`"false"`): halaman yang sama menampilkan form login dan
  pendaftaran akun asli.
- `POST /api/session/daftar` (Tokowa) menerima `{nama, email, password}`,
  memanggil `POST /api/auth/register` obrool. Akun baru wajib verifikasi email
  sebelum bisa dipakai `POST /api/session`.
- `POST /api/session` (Tokowa) menerima `{email, password}`, memanggil
  `POST /api/auth/login` obrool, menyimpan cookie `tokowa_token`.
- `DELETE /api/session` (Tokowa) → logout.
- `POST /api/toko` (Tokowa, butuh cookie sesi) menerima `{nama, setuju: true}`:
  membuat ruang toko di obrool lalu mengaktifkan mode toko dengan persetujuan
  skema biaya. Balasan `201 {data: {agentId, nama}}`. UI-nya ada di halaman
  `/toko-saya` saat penjual belum punya toko, plus tautan `Masuk penjual` dan
  `Daftar jadi penjual` di navigasi dan footer.

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
Kanonik v1 (Tokowa hanya memakai ini):
- `GET /api/v1/seller/produk?agentId=&limit=&offset=&q=` → `{data:{items[], total, limit, offset}}`
- `POST /api/v1/seller/produk?agentId=` → buat produk → `201 {data: produk}`.
- `PATCH /api/v1/seller/produk/{produkId}?agentId=` → update parsial
  (termasuk `aktif: false` untuk nonaktifkan) → `{data: produk}`. **Bukan PUT.**
- `DELETE /api/v1/seller/produk/{produkId}?agentId=` → hapus lunak → `{data:{ok:true}}`.
- `POST /api/v1/seller/produk/{produkId}/hapus-permanen?agentId=` →
  body `{nama}`, nilai harus sama dengan nama produk (case-insensitive).
  Ditolak bila produk masih dirujuk pesanan.
  → `{data:{ok:true, nama}}`.
- `POST /api/v1/seller/foto?agentId=` (multipart `file`, sama seperti foto
  produk lama) → `{data:{url}}`.
- Galat selalu `{error:{code,message}}`. Jalur lama `/api/agents/{id}/toko/*`
  (envelope `{produk}`/`{setting}`/`{url}`, galat string polos) tetap hidup
  untuk dashboard internal obrool; logika validasi dibagi lewat
  `@/lib/toko-admin` supaya aturannya tidak bercabang.

### 4.5 Penjual: setting toko (auth user)
- `GET`/`POST /api/v1/seller/setting?agentId=` → `{data:{setting}}`.
  (Jalur lama `/api/agents/{id}/toko/setting` tetap hidup untuk dashboard
  internal obrool.)
- Field terkini: `jendelaReturHari`, `ongkirRetur`, `qrisStatisNama`,
  `qrisStatisUrl`, `jamBuka`, `jamTutup`, `hariBuka`, dan **`ongkirSellerFlat`**
  (tarif kirim sendiri per pesanan, 0-1.000.000; `null`/kosong = belum ada
  tarif tetap). Tambahan `ongkirSellerFlat` dipakai quote `seller_delivery`.
- Field kurir instan: `kurirInstanDasar` (0-1.000.000), `kurirInstanPerKm`
  (0-100.000), `kurirInstanJarakMaksKm` (>0-100; semua `null`/kosong =
  nonaktif), plus titik toko `lat`/`lng` (berpasangan, rentang koordinat sah).
  Dipakai quote `courier_instant` (bagian 4.9).

### 4.6 Penjual: pesanan (auth user)
- `GET /api/v1/seller/pesanan?agentId=&status=&cursor=&limit=` (limit maks 50)
  → hanya pesanan milik agent user; default mengembalikan semua status kecuali `draf`.
  Ringkasan per item: `{id,total,status,metodeBayar,adaBukti,pelanggan,jumlahItem,agentId,createdAt,updatedAt}`.
- `GET /api/v1/seller/pesanan/{id}` → detail.
- `POST /api/v1/seller/pesanan/{id}/aksi` → body `{aksi}`. Aturan transisi:
  | aksi | dari | hasil |
  |---|---|---|
  | `konfirmasi` | `tunggu_verifikasi` | `paid` (+ stok + ledger) |
  | `tolak` | `tunggu_verifikasi` | `batal` |
  | `kirim` | `paid` | `kirim` |
  | `selesai` | `kirim` | `selesai` |
  | `batal` | `tunggu_bayar`, `tunggu_verifikasi` | `batal` |
  Transisi tidak valid dibalas `409` dengan pesan Indonesia.
  `konfirmasi` bukan update status mentah: ia memanggil `terapkanPesananPaid`
  (idempoten) sehingga stok berkurang, kartu stok tercatat, dan ledger bertambah.

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
    pelangganMask, items[], langkah[{status,label,keadaan}],
    pengiriman{mode,ongkir,alamat}, bayar, bisaBatal, bisaRetur,
    jendelaReturHari, ongkirRetur, retur, dibuatAt, diperbaruiAt}}`.
    `pengiriman` `null` bila pesanan lama belum punya mode kirim.
  - `bisaBatal` = status `tunggu_bayar`/`tunggu_verifikasi`. `bisaRetur` =
    status `paid`/`kirim`/`selesai`, belum lewat `jendelaReturHari` sejak
    `createdAt`, dan belum ada retur hidup. `ongkirRetur` = `pembeli|toko|
    bagi_dua` dari setting toko. `retur` = `{kode, status, statusLabel, alasan,
    alasanLabel, refundTotal, refundCatatan, dibuatAt, diperbaruiAt}` atau `null`.
  - Tidak cocok → `404 not_found` dengan pesan yang tidak membocorkan apakah
    pesanan ada. Kode salah format → `400`.
  - Nomor pembeli dikembalikan termask (`••••6789`). Bukti bayar dan paylink tidak
    ikut dibuka.
  - `bayar` hanya diisi saat status `tunggu_bayar`/`tunggu_verifikasi`, berisi
    `{metode, qrisNama, qrisUrl}` dari `TokoSetting` toko (bisa `null` bila toko
    belum memasang QRIS).
- Tokowa: `GET /api/lacak` (BFF publik tanpa token) + halaman `/lacak`
  (`?kode=` boleh dikirim di tautan WhatsApp untuk mengisi otomatis).

### 4.9 Pemesanan web (publik, tanpa auth)
Tamu (guest checkout) dengan nomor WhatsApp, bukan akun. Harga selalu dihitung
ulang dari DB, tidak pernah dari body.

- `POST /api/v1/pesanan/quote` → body `{agentId, items:[{produkId, qty}], mode, lat?, lng?}`.
  Validasi: agent ada, 1-20 baris, qty 1-99 per produk, produk aktif dan milik
  agent, stok cukup. Balasan `{data: {subtotal, ongkir, total, jarakKm, mode, labelMode,
  catatan, items[]}}`. `ongkir`/`total` bisa `null` bila tarif belum bisa
  dihitung sistem (lihat `catatan`). `jarakKm` hanya terisi untuk
  `courier_instant`. Rate limit 30/menit per IP.
- `POST /api/v1/pesanan` → body `{agentId, items, mode, pelanggan, alamat?,
  lat?, lng?, idempotencyKey?}`. Membuat pesanan status `tunggu_bayar`, `metodeBayar`
  `qris_toko`. `pelanggan` = nomor WA (digit, 9-15). `alamat` wajib saat
  `seller_delivery` dan `courier_instant` (min 5 karakter); `courier_instant`
  juga wajib `lat`/`lng` sah (selain itu `400`). Bila `ongkir` `null` → `400`
  (arahkan ke WhatsApp). Balasan `{data: {id, kode, total, ongkir, status, mode, labelMode,
  bayar{qrisNama,qrisUrl}}}`. `idempotencyKey` unik: kirim ulang key yang sama
  mengembalikan pesanan yang sama (tanpa membuat baru). Rate limit 6 per 10
  menit per IP.
- **Aturan mode kirim:** `self_pickup` ongkir 0; `seller_delivery` pakai
  `TokoSetting.ongkirSellerFlat` (null → belum bisa dihitung); `courier_instant`
  pakai tarif jarak milik toko: `kurirInstanDasar` (termasuk 3 km pertama) +
  `kurirInstanPerKm` × km berikutnya (dibulatkan ke atas), dari titik toko
  (`lat`/`lng` setting) ke lokasi pembeli, dibulatkan ke ratusan rupiah, dengan
  batas `kurirInstanJarakMaksKm`. Tarif/titik belum diisi, lokasi pembeli belum
  ada, atau jarak di luar jangkauan → `null` + catatan arahan WhatsApp.
  Koordinat pembeli hanya dipakai menghitung tarif saat itu; tidak disimpan.
- **Stok tidak dikurangi saat pesanan dibuat.** Stok berkurang saat `paid`
  (lewat `terapkanPesananPaid`), jadi pesanan yang tak pernah dibayar tidak
  mengunci stok.
- Tokowa: BFF publik `POST /api/pesan/quote` + `POST /api/pesan`, form "Pesan
  dari web" di `/produk/[id]` dan checkout `/keranjang`. Setelah pesanan dibuat
  pembeli diarahkan ke `/lacak?kode=..&hp=..` (4 angka terakhir terisi
  otomatis). Bukti bayar bisa dilampirkan di halaman lacak atau lewat WhatsApp.
  Mode `courier_instant` menampilkan alamat + tombol "Pakai lokasi saya"
  (geolocation browser); `lat`/`lng` ikut dikirim ke quote/pesan dan quote
  menampilkan jarak. Tarif & titik toko diatur penjual di Pengaturan toko.
- **Keranjang multi-produk (sisi Tokowa, tanpa endpoint baru).** Keranjang
  disimpan di `localStorage` (`tokowa-keranjang-v1`) dan dikirim utuh sebagai
  `items[]` ke `quote`/`pesan` yang memang sudah menerima 1-20 baris. Satu
  keranjang dikunci ke satu toko: menambah produk dari agent lain ditolak dengan
  pesan jelas, karena satu pesanan hanya milik satu agent. Tombol "Tambah ke
  keranjang" ada di halaman produk, halaman `/keranjang` mengatur jumlah/hapus
  lalu checkout. Jumlah dibatasi `stok` produk dan `99`.

### 4.10 Konfirmasi bayar pembeli (publik, tanpa auth)
Menutup jeda antara pesanan web dibuat dan verifikasi seller. Pembeli menyatakan
sudah membayar; sistem TIDAK memeriksa uang. Bukti berkas kini bisa dilampirkan
dari web (R2 aktif), tetap opsional.

- `POST /api/v1/pesanan/bayar` → body `{kode, hp}` (verifikasi sama seperti
  lacak: kode 6 huruf terakhir id atau id penuh + 4 angka terakhir nomor WA).
  Bila status `tunggu_bayar` → geser ke `tunggu_verifikasi`, tandai
  `bukti = "pembeli-menyatakan-bayar"` (hanya bila `bukti` masih kosong), dan
  beri tahu owner (WABA bila terpasang, kalau tidak pesanan tetap muncul di
  dashboard seller sebagai antrean). Balasan `{data: {id, kode, status, pesan}}`.
  Idempoten: `tunggu_verifikasi` yang sudah ada tidak memicu notifikasi ulang;
  `paid`/`kirim`/`selesai` membalas "sudah dibayar". Kode/nomor tidak cocok →
  `404`. Rate limit 10 per 10 menit per IP.
- `POST /api/v1/pesanan/bukti` → multipart `{kode, hp, file}` (PNG/JPG/WebP,
  maks 5 MB, dicek magic bytes). Verifikasi kode+hp sama; hanya status
  `tunggu_bayar`/`tunggu_verifikasi` (selain itu `409`). File disimpan di R2
  prefix `bukti-bayar/`, URL menjadi `TokoPesanan.bukti`; dari `tunggu_bayar`
  berikutnya sama persis seperti `/bayar` (geser + notifikasi owner, penanda
  tidak ditimpa). Penjual melihatnya lewat detail pesanan. Rate limit 8 per
  10 menit per IP. R2 belum terkonfigurasi → `503`.
- Jalur chat ikut memakai helper yang sama (`konfirmasiBayarPembeli`), jadi bot
  tidak lagi menjawab "dicek otomatis oleh sistem" untuk QRIS statis toko.
- Tokowa: BFF publik `POST /api/lacak/bayar` + tombol "Saya sudah bayar" di kartu
  `/lacak`, dan BFF `POST /api/lacak/bukti` + lampiran bukti opsional pada kartu
  yang sama (dengan lampiran, tombol menjadi "Kirim bukti & tandai sudah
  bayar"). Setelah menandai, halaman menyegarkan status sendiri (menjadi
  "Menunggu pemeriksaan toko").
- Stok tetap utuh di langkah ini; pengurangan hanya saat seller `konfirmasi`.

### 4.11 Pembatalan & retur (publik + penjual)
Pengecualian status setelah pesanan dibuat. Verifikasi pembeli sama seperti lacak
(kode 6 huruf terakhir id atau id penuh + 4 angka terakhir nomor WA).

- `POST /api/v1/pesanan/batal` → body `{kode, hp}`. Hanya status `tunggu_bayar`/
  `tunggu_verifikasi` yang bisa dibatalkan; jadi `batal`. Stok tidak tersentuh
  (belum pernah berkurang). Batal ulang / status tidak bisa dibatalkan → `409`.
  Balasan `{data: {id, kode, status, pesan}}`. Rate limit 10 per 10 menit per IP.
- `POST /api/v1/pesanan/retur` → body `{kode, hp, alasan, catatan?}`. `alasan` ∈
  `rusak | basi | salah | tidak_sesuai | berubah_pikiran | lain` (di luar itu →
  `400`). Hanya status `paid`/`kirim`/`selesai` dan masih dalam
  `jendelaReturHari` sejak `createdAt`. Satu pengajuan hidup per pesanan (sudah
  ada → `409`). Membuat `TokoRetur` status `diajukan`, memberi tahu owner toko.
  Balasan `{data: {returKode, status, pesan}}`. Rate limit 8 per 10 menit per IP.
- `GET /api/v1/seller/retur?agentId=&status=` (auth user, lewat agent). Tanpa
  `status` → daftar aktif (`diajukan|disetujui|barang_diterima`); `status=riwayat`
  → (`ditolak|selesai`). Nomor pembeli di-mask. Balasan `{data: {items[]}}`.
- `POST /api/v1/seller/retur/[id]/aksi` (auth user, hanya pemilik agent) → body
  `{aksi: setuju|tolak|terima_barang|refund, catatan?, layakJual?, nominal?}`.
  Alur: `diajukan` → `setuju`/`tolak`; `disetujui` → `terima_barang`
  (`layakJual` true mengembalikan stok lewat `catatKartuStok` sebab `retur_masuk`,
  false tidak) → `barang_diterima` → `refund` (`nominal` yang diisi seller, boleh
  sebagian, tidak harus sama dengan total pesanan) → `selesai` + ledger
  `decrement`. Aksi yang tidak sesuai status → `409`. Bukan pemilik → `403`.
- Tokowa: BFF publik `POST /api/lacak/batal`, `POST /api/lacak/retur`; tombol
  "Batalkan pesanan" (konfirmasi dua langkah) dan form "Ajukan retur" di kartu
  `/lacak`. Halaman penjual `/toko-saya/[agentId]/retur` (daftar aktif + riwayat)
  dengan aksi setuju/tolak/terima barang/refund. Keputusan uang dan kepemilikan
  bukti tetap di seller; web tidak pernah memindahkan uang.
- Belum ada model sengketa: kasus barang bermasalah ditutup lewat retur.

### 4.12 Webhook balik obrool → Tokowa (obrool mengirim, Tokowa menerima)
Obrolan status pesanan & retur saat status berubah, supaya Tokowa tidak harus
menarik ulang (pull) terus. Dikonfigurasi di obrool lewat env server:
`TOKOWA_WEBHOOK_URL` (URL penerima Tokowa) dan `TOKOWA_WEBHOOK_SECRET` (rahasia
HMAC bersama; di Tokowa disimpan sebagai `OBROOL_WEBHOOK_SECRET`). Tanpa kedua
env itu, kirim adalah no-op (persis pola nomor WA belum diatur).

- Kejadian yang dikirim: `order.status_changed` setiap transisi status
  `TokoPesanan` (buat pesanan web `tunggu_bayar`, konfirmasi bayar pembeli
  `tunggu_verifikasi`, `terapkanPesananPaid` → `paid`, aksi seller
  kirim/selesai/tolak/batal, batal pembeli dari web), `retur.updated` setiap
  perubahan `TokoRetur` (pengajuan `ajukan`, putusan `setuju`/`tolak`,
  `terima_barang`, `refund` → `selesai`), dan `dispute.opened` /
  `dispute.decided` untuk sengketa (bagian 4.14).
- Format: POST JSON `{id: "evt_<uuid>", type, version: 1, occurredAt, data}`.
  Header `x-tokowa-timestamp` (unix detik) dan `x-tokowa-signature` =
  `sha256=` + HMAC-SHA256 hex dari `<timestamp>.<body mentah>`.
  `data order`: `{pesananId, kode, agentId, statusLama, statusBaru, total,
  pelangganMask}` (nomor selalu di-mask, tidak pernah utuh). `data retur`:
  `{returId, kode, pesananId, pesananKode, agentId, aksi, statusLama, statusBaru,
  refundTotal}`.
- Pengirim: fire-and-forget lib `webhook-tokowa.ts`, timeout 4 detik, maks 2
  percobaan. Kegagalan kirim hanya `console.warn` dan tidak pernah menggagalkan
  alur pesanan. Tidak ada antrean/outbox; kejadian yang gagal terkirim hilang.
- Penerima Tokowa: `POST /api/webhooks/obrool`. Verifikasi tanda tangan
  (constant-time) + jendela timestamp 5 menit → selain itu `401`; penerima
  belum dikonfigurasi → `503`; body bukan JSON / tanpa `id`+`type` → `400`.
  Id acara di-dedup (idempotent, ingatan 1000 id terakhir per instance) →
  balasan `{data: {received: true}}` atau `{data: {received: true, duplikat:
  true}}`. Saat ini penerima hanya mencatat log terstruktur `[webhook-obrool]`;
  konsumen nyata (invalidasi cache / notifikasi pembeli) menyusul bila polling
  mulai berat.

### 4.13 Webhook WhatsApp masuk (Meta → obrool; Tokowa tidak di jalur chat)
Jalur belanja inti Tokowa adalah chat di satu nomor WhatsApp. Webhook Meta
dipasang dan dimiliki obrool; Tokowa sama sekali tidak meneruskan body Meta.

- `GET /api/channels/whatsapp/webhook` obrool: handshake Meta
  (`hub.mode=subscribe` + `hub.challenge`) dengan `META_VERIFY_TOKEN` global
  atau token per-agent (`whatsappVerifyToken`/`agent.id`). Fail-closed: token
  salah → `403`.
- `POST /api/channels/whatsapp/webhook` obrool: wajib lolos HMAC Meta
  (`verifyMetaSignature`, raw body; tanpa secret → `401`). Agent dipilih dari
  `metadata.phone_number_id` yang cocok dengan `whatsappPhoneNumberId` agent
  (atau `?agentId=`). Nomor tanpa agent → `200` diam (tidak ada aksi). Pesan
  didedup per `wamid`, lalu gerbang paket aktif + kuota kanal, lalu dispatch:
  pemilik/staff (`handlePerintahToko`) → jalur platform
  (`handlePesanPlatformTokowa`, hanya agent platform: satu nomor banyak toko,
  pilih warung terdekat) → jalur pembeli toko (`handlePesanBeli` →
  `buatDrafBeli`) → console → LLM umum. Balasan toko/platform/beli dikirim
  lewat WABA agent itu sendiri (`sendChannelMessage`).
- Tokowa hanya menautkan pembeli ke `wa.me` (`NEXT_PUBLIC_WA_NUMBER`; saat ini
  kosong → tombol nonaktif, lihat bagian 5). Tidak ada endpoint Meta di Tokowa.
- Jalur platform ikut menawarkan kurir instan: bila lokasi pembeli ada dan
  toko tujuan menetapkan tarif, ongkir dihitung dengan rumus web yang sama
  (`hitungOngkirKurirInstan`) dan ditawarkan di balasan; pembeli membalas
  `KURIR` saat konfirmasi draf untuk menambahkannya ke total sebelum bayar.
- Terverifikasi di dev (`uji-waba.mjs`, 8/8): GET token benar `200` + echo
  challenge, token salah `403`, POST tanpa tanda tangan `401`, POST bertanda
  tangan untuk `phone_number_id` asing `200` diam, POST pesan pembeli
  bertanda tangan ke agent yang dikonfigurasi membuat pesanan `draf`,
  POST duplikat `wamid` yang sama tidak membuat pesanan kedua.

### 4.14 Sengketa dua tahap (publik + penjual + admin)
Eskalasi setelah retur, **dua tahap**: toko menjawab dulu, admin menengahi.
Model `TokoSengketa` (kode `S` + 5 huruf terakhir id). Status:
`menunggu_toko | menunggu_admin | selesai`; putusan
`untuk_pembeli | untuk_toko`. Putusan admin bersifat penengahan tercatat;
uang tetap bergerak langsung pembeli↔toko (platform tidak memegang dana).

- `POST /api/v1/pesanan/sengketa` → body `{kode, hp, alasan}` (verifikasi
  kode+4 angka seperti lacak; alasan 5-300 karakter). Hanya pesanan
  `paid`/`kirim`/`selesai`, dan hanya bila retur terakhir `ditolak` atau masa
  retur sudah lewat; retur yang masih berjalan harus diputuskan dulu. Satu
  sengketa aktif per pesanan (dobel → `409`). Balasan `201 {data: {kode,
  status, pesan}}`. Rate limit 5 per 10 menit per IP.
- **Tahap toko (maks 3 hari).** `GET /api/v1/seller/sengketa?agentId=`
  (aktif; `status=riwayat` untuk selesai) dan
  `POST /api/v1/seller/sengketa/{id}/aksi` `{aksi: setuju|tolak, nominal?,
  alasan?}` (auth pemilik). Setuju = refund nominal seller → selesai, tercatat
  di ledger, **tanpa teguran**. Tolak wajib alasan → naik ke admin. Lewat
  batas tanpa jawaban, tahap naik sendiri ke admin saat berikutnya dibaca
  (eskalasi malas, tanpa cron).
- **Tahap admin.** `GET /api/v1/admin/sengketa?status=menunggu_admin|
  menunggu_toko|selesai|semua` (auth role admin) dengan toko, kode pesanan,
  total, ringkasan item, alasan toko, nomor pembeli termask.
  `POST /api/v1/admin/sengketa/{id}/aksi` `{keputusan: untuk_pembeli|
  untuk_toko, refundTotal?, catatan?}`; `untuk_toko` wajib catatan. Hanya
  sengketa `menunggu_admin` yang bisa diputuskan admin (selain itu `409`).
- **Teguran & suspensi.** Putusan admin `untuk_pembeli` mencatat satu
  `TokoTeguran` (toko yang menyelesaikan sendiri di tahap toko tidak kena).
  **3 teguran dalam 90 hari → toko disuspensi** (`TokoSetting.tersuspensi`):
  produk hilang dari katalog, quote/buat pesanan web `403`, bot platform
  melewati toko itu, pesanan chat baru ditolak. Admin mencabut lewat
  `POST /api/v1/admin/suspensi` `{agentId}`; teguran tidak dihapus, gugur
  sendiri setelah 90 hari. `GET /api/v1/admin/sellers` ikut memuat
  `teguranAktif`, `ambangTeguran`, dan status suspensi. Penjual melihat
  tegurannya di Beranda (4.4/`/api/v1/seller/analitik`).
- Lacak (`4.8`) ikut mengembalikan `bisaSengketa` dan `sengketa`
  (`{kode, status, statusLabel, batasTokoAt, alasanTolakToko, putusan,
  putusanLabel, refundTotal, catatanPutusan, ...}`).
- Webhook: `dispute.opened` (dibuka), `dispute.escalated` (naik ke admin),
  `dispute.decided` (diputuskan, membawa tahap putusan), lihat bagian 4.12.
- Tokowa: BFF `POST /api/lacak/sengketa`, blok sengketa + form di kartu
  `/lacak`, halaman penjual `/toko-saya/[agentId]/sengketa`, halaman admin
  `/admin/sengketa`, dan cabut suspensi di `/admin/penjual`.

### 4.15 Dua tingkat: penumpang Tokowa dan lulusan WABA
- **Tingkat 1, penumpang (default).** Usaha tanpa NIB/kartu kredit jualan
  menumpang nomor platform Tokowa. Chat dan transaksi lewat agent platform.
- **Tingkat 2, lulusan WABA.** Penjual yang siap legalitas + kartu kredit
  mengajukan WABA sendiri lewat obrool. Setelah disetujui Meta, toko tetap
  tampil dan direkomendasikan di Tokowa, tetapi chat dan transaksi berjalan
  langsung di agent milik usaha itu.
- **Penanda kelulusan:** `TokoSetting.wabaSendiri` (boolean) +
  `nomorJualan` (nomor WhatsApp publik toko, digit 9-15). Status mandiri
  diaktifkan obrool saat pengajuan WABA disetujui (server-side); Tokowa tidak
  menyediakan aktivasi mandiri. Pengaturan Tokowa menampilkan status + tombol
  "Lanjut daftar di obrool" yang didahului peringatan syarat (NIB, kartu
  kredit, nomor belum terdaftar, Business Manager, waktu verifikasi).
- **Onboarding di sisi obrool:** halaman `/waba` (menu Explore di sidebar,
  di atas Template Marketplace) memandu penjual lewat syarat checklist,
  pilih agent, dan tombol Embedded Signup Meta yang sudah ada.
- **Handoff jujur di bot platform:** bila warung terpilih adalah lulusan,
  bot platform menyerahkan dengan tautan chat langsung lalu mundur; tidak
  berpura-pura menjadi toko itu. Satu pesanan tetap milik satu agent
  (pemilik transaksi).
- **Aturan matching:** lulusan tetap ikut pencocokan warung terdekat dengan
  bobot sama; tidak ada prioritas khusus.
- **Uang, retur, sengketa, teguran tidak berubah** di kedua tingkat karena
  model transaksinya sama; bedanya hanya kanal chat.

## 5. Keputusan yang sudah dikunci

- **KYC satu backend.** Tidak ada state KYC yang disimpan di Tokowa; antrean
  admin di Tokowa adalah tampilan langsung dari obrool.
- **Onboarding penjual milik Tokowa, identitas tetap di obrool.** Daftar,
  masuk, dan buat toko tampil sebagai alur Tokowa; akun dan ruang toko
  disimpan di obrool lewat BFF. Penjual tidak perlu membuka studio AI agent.
- **Webhook `kyc.decided` dibatalkan** untuk F3. Antrean admin cukup menarik
  ulang data (pull). Webhook outbound ditunda; lihat bagian 7.
- **Hapus permanen produk butuh konfirmasi nama.** Ini bertahan sebagai
  pengaman, dan UI Tokowa memintanya.
- **Pembayaran pesanan web: QRIS statis toko + verifikasi seller.** Tidak pakai
  paylink iPaymu untuk jalur ini. Pembeli membayar ke QRIS toko, seller
  memverifikasi lewat aksi `konfirmasi` (`tunggu_verifikasi` → `paid`).
- **Satu bucket R2 untuk semua media, prefix per kebutuhan.** Bucket
  `obrool-ava` (publik, `R2_PUBLIC_BASE_URL`) dipakai bersama lewat helper
  `@/lib/r2`: avatar, `toko/` (foto produk), `kyc/` (dokumen KYC),
  `bukti-bayar/` (bukti transfer web). Voice note boleh bucket terpisah
  (`R2_VOICE_BUCKET`, lifecycle 7 hari). URL bersifat publik-tak-tertebak
  (UUID). Catatan: dokumen KYC adalah PII di bucket publik; memindahkannya ke
  bucket privat + URL bertanda tangan adalah pengerasan lanjutan (bagian 7).
- **Bukti bayar bisa dilampirkan dari web, tetap opsional.** Dengan R2 aktif,
  pembeli boleh mengunggah bukti di `/lacak` (bagian 4.10); tanpa lampiran,
  tombol "Saya sudah bayar" tetap jalan. Lewat WhatsApp juga tetap bisa.
- **Satu pesanan hanya untuk satu toko.** Keranjang lintas toko ditolak di web
  (bukan digabung belakangan), karena `TokoPesanan` terikat satu `agentId` dan
  ongkir per toko.
- **Webhook balik bertanda tangan HMAC, fire-and-forget.** obrool mengirim
  `order.status_changed` + `retur.updated` ke Tokowa (bagian 4.12);
  keberhasilan kirim tidak boleh menahan alur pesanan, dan penerima wajib
  menerima id yang sama dua kali tanpa efek samping.
- **Endpoint penjual yang dipakai Tokowa kanoniknya `v1`.** Produk, setting,
  dan foto penjual memakai `/api/v1/seller/*` + envelope `{data}` /
  `{error:{code,message}}`. Jalur lama `/api/agents/{id}/toko/*` sengaja tidak
  dihapus karena dashboard internal obrool masih memakainya; keduanya berbagi
  helper validasi yang sama (`@/lib/toko-admin`). Endpoint internal lain
  (analitik/status/templates/withdraw) di luar kontrak Tokowa.
- **Webhook WhatsApp dimiliki obrool; Tokowa tidak meneruskan body Meta.**
  Meta menunjuk langsung ke obrool (bagian 4.13). Opsi Tokowa pass-through
  ditolak: tidak menambah nilai, hanya menambah titik gagal di jalur chat.
- **Tiga mode kirim, kurir instan pakai tarif jarak milik toko.**
  `self_pickup` dan `seller_delivery` (tarif flat owner) bisa dihitung;
  `courier_instant` dihitung dari tarif dasar + per km dan titik yang
  ditetapkan toko sendiri (bagian 4.9), bukan estimasi platform. Bila toko
  belum mengaturnya, pembeli tetap diarahkan ke WhatsApp. Binderbyte hanya
  ekspedisi reguler, tidak dipakai untuk instan.
- **Stok berkurang saat `paid`, bukan saat pesanan dibuat.** Satu jalur:
  `terapkanPesananPaid` (idempoten), dipakai webhook pembayaran dan aksi
  `konfirmasi` seller.
- **Pelacakan pembeli butuh kode pesanan + 4 angka terakhir nomor WA.** Bukan
  id saja, supaya tautan yang tersebar tidak membuka isi pesanan orang lain.
- **Refund retur = nominal yang diisi seller, boleh sebagian.** Uang di tangan
  seller (transfer manual), sistem hanya mencatat dan menyesuaikan ledger.
  Penolakan tidak otomatis mengubah stok; pengembalian stok hanya saat seller
  menandai barang layak jual.
- **Sengketa dua tahap: toko menjawab dulu, admin menengahi.** Pembeli baru
  bisa membuka sengketa setelah retur ditolak atau masa retur lewat (retur
  tetap jalur pertama). Admin hanya memutuskan sengketa yang ditolak/diabaikan
  toko; putusannya penengahan tercatat karena uang bergerak langsung
  pembeli↔toko. Sengketa yang dimenangkan pembeli di tahap admin menjadi
  teguran; 3 teguran dalam 90 hari menyuspensi toko (bagian 4.14).
- **Tokowa dua tingkat, lulus WABA via obrool.** Penumpang jualan menumpang
  nomor platform; lulusan tetap direkomendasikan di Tokowa tetapi chat dan
  transaksi langsung di agent miliknya (bagian 4.15).
- **WA number belum diatur.** Semua tombol WhatsApp nonaktif dengan
  `title="Nomor WhatsApp belum diatur"`. Ini keadaan yang disengaja, bukan bug.

## 6. F4 (sisa)

Semua butir F4 sudah dikerjakan: **chat WABA** (webhook Meta dimiliki obrool,
Tokowa tidak di jalur; bagian 4.13), **pelacakan pesanan pembeli** (bagian 4.8),
**quote + buat pesanan web** (bagian 4.9), **konfirmasi bayar pembeli**
(bagian 4.10), **keranjang multi-produk** (bagian 4.9, sisi Tokowa),
**pembatalan + retur pembeli/penjual** (bagian 4.11), **webhook balik**
(bagian 4.12), **tarif `courier_instant`** (bagian 4.9), **sengketa**
(bagian 4.14), **beranda penjual** (`/api/v1/seller/analitik`), dan **pesanan
saya** (riwayat lokal pembeli di Tokowa).

## 7. Masih terbuka

- Bucket privat + URL bertanda tangan untuk dokumen KYC (kini publik di
  bucket bersama; lihat bagian 5).
- Kedaluwarsa `idempotencyKey` `POST /api/v1/pesanan` (kini unik selamanya,
  usulan window 24 jam).
- `message` error: tetap Indonesia + `code` stabil seperti sekarang, atau
  Tokowa melakukan i18n sendiri dari `code`.
- Masuk dengan akun WhatsApp (OTP) **belum dibangun dan tidak dipalsukan**.
  Syaratnya pengirim WhatsApp platform yang aktif: nomor WABA
  (`WHATSAPP_CONSOLE_PHONE_NUMBER_ID`), token Meta (`whatsappToken`), dan
  `NEXT_PUBLIC_WA_NUMBER` terisi. Selama itu kosong, auth Tokowa tetap
  email+password dan tombol chat nonaktif. Setelah pengirim terverifikasi,
  bangun `POST /api/session/wa/minta-kode` + verifikasi kode 6 digit
  (`WhatsappAuthCode` purpose `login`, kedaluwarsa 15 menit, sekali pakai),
  lalu sesuaikan copy halaman masuk.

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
| Aksi `konfirmasi` update status mentah | wajib `terapkanPesananPaid` agar stok + ledger ikut |
| Bot menjawab "dicek otomatis" untuk QRIS statis | QRIS statis: geser `tunggu_bayar` → `tunggu_verifikasi` + beri tahu owner |
| Bot "YA" menerbitkan paylink iPaymu untuk pesanan web | pesanan web `qris_toko` dapat cara bayar toko, bukan paylink |
