# DESIGN.md — Tokowa.app

> Arah desain ini ditulis oleh pemilik produk. Tokowa.app adalah marketplace
> lokal pertama yang berbasis chat WhatsApp untuk pembeli dan seller kecil di
> Indonesia. Dokumen ini adalah sumber arah; `antislop.md` adalah filter yang
> dijalankan di atasnya.

## 1. Identitas (satu baris)

Tokowa membuat belanja dan berjualan cukup lewat chat WhatsApp, dan harus
terasa **hangat serta lokal**: seperti warung tetangga yang dekat, ramah, dan
membumi, bukan etalase korporat yang dingin.

## 2. Kepribadian (3 kata)

**Tenang, jujur, menolong.**

- Tenang: tidak berisik, tidak banyak gimmick, tidak mendorong pengguna.
- Jujur: tidak mengklaim apa yang tidak ada, status apa adanya.
- Menolong: setiap layar menjawab "apa langkah saya berikutnya".

Contoh nada bicara:
- Baik: "Pesanan masuk. Konfirmasi untuk lanjut." 
- Hindari: "Solusi revolusioner untuk bisnis Anda!" (buzzword, R-16)

## 3. Dial (antislop, core Part 3)

**ENERGY 2 / RHYTHM 2 / MOTION 2.**

- ENERGY 2: menyapa dengan jelas, tidak agresif.
- RHYTHM 2: mayoritas konsisten, beberapa seksi boleh keluar dari pola.
- MOTION 2: transisi halus dan scroll-reveal secukupnya, bukan koreografi.

## 4. Tema

Terang (light) default. Karena produk ini dipakai sambil berjualan di siang
hari lewat HP, mode terang adalah pilihan utama, bukan ikut tren. Toggle gelap
belum menjadi bagian pass ini (akan diminta sebagai keputusan terpisah bila
produk menuntutnya, R-21).

## 5. Palet

Aksen tunggal teal-green "segar" (`--accent`). Neutral (paper, ink, muted)
hangat-netral dan tidak dihitung sebagai warna inti. Varian `-soft`/`-ink`
dipakai untuk chip status dan teks kecil di atas latar tint.

| Peran | Token | Nilai | Alasan (R-31) |
|---|---|---|---|
| Paper (kanvas) | `--paper` | `#F6F7F4` | off-white hangat-netral, bukan putih steril |
| Paper 2 (panel) | `--paper-2` | `#ECF0EB` | latar sekunder: header tabel, pratinjau |
| Surface (kartu) | `--surface` | `#FFFFFF` | kartu/permukaan di atas paper |
| Ink (teks utama) | `--ink` | `#16211E` | hampir hitam, sedikit hijau, kontras tinggi |
| Muted ink | `--muted` | `#5C6B65` | teks sekunder, kontras cukup di paper |
| Border | `--border` | `#DDE4DF` | pemisah lembut, tidak abu-abu dingin |
| Aksen | `--accent` | `#0F766E` | teal-green segar, latar CTA utama (teks putih) |
| Aksen terang | `--accent-bright` | `#0E8C82` | hanya grafik/ikon/dot, bukan teks kecil |
| Aksen soft | `--accent-soft` | `#D8F1EC` | latar tint: banner, nav aktif, kartu terpilih |
| Aksen ink | `--accent-ink` | `#0A5B54` | teks kecil di atas tint/paper |
| Sukses | `--ok` / `--ok-soft` / `--ok-ink` | `#1F8A54` / `#DFF3E8` / `#146641` | status selesai/terkirim (fungsional) |
| Peringatan | `--warn` / `--warn-soft` / `--warn-ink` | `#A16207` / `#F5EDD4` / `#78540B` | stok menipis/perlu aksi (fungsional) |
| Bahaya | `--danger` / `--danger-soft` / `--danger-ink` | `#C04237` / `#F8E4E1` / `#93291F` | batal/gagal/tolak (fungsional) |

Aturan pakai aksen: satu aksen di titik kunci (CTA utama, status aktif, satu
fokus per layar). Tidak dipakai untuk border, ikon, dan latar sekaligus (R-13).
Setiap teks harus lolos WCAG AA (4.5:1 normal, 3:1 besar). Verifikasi dengan
`contrast-check.py` dari skill `antislop-human`, bukan dengan mata.

Kontras terverifikasi: ink/paper 15.4:1, ink/surface 16.5:1, muted/paper 5.2:1,
putih/accent 5.5:1, accent-ink/accent-soft 6.7:1, putih/ok-ink 7.0:1,
warn-ink/warn-soft 5.8:1, danger-ink/danger-soft 6.7:1.

## 6. Tipografi

- **Plus Jakarta Sans** untuk UI dan body. Alasan: sans humanis yang hangat dan
  akrab, sekaligus dirancang di Indonesia, cocok untuk brand "lokal" (R-06).
  Bukan dipilih karena default AI.
- Skala: heading fluid dengan `clamp()`, body 15-16px di mobile, 16-17px di
  desktop. Tidak memakai heading monospace atau label KAPITAL berspasi lebar.
- Angka & kode pesanan: untuk saat ini memakai Plus Jakarta Sans tabular
  (`font-variant-numeric: tabular-nums`). Font mono khusus hanya bila nanti
  terbukti memperjelas kode, bukan demi gaya teknis.

## 7. Motif identitas

Satu gestur yang diulang agar desain terasa milik Tokowa. Kandidat motif motif
masih menunggu pemilihan pemilik bersama keputusan logo (Bagian 13): kanopi
warung (lengkung + lipatan), tepi nota bergerigi, atau gabungan keduanya.

Motif dipakai hemat: satu tempat utama per layar, bukan di setiap elemen.

## 8. Ikonografi

Ikon harus relevan dengan isinya (R-04). Hindari set ikon pilihan default
(sparkle, star, magic, lightning, diamond, robot, orb) dan hindari satu pustaka
stroke tipis untuk semua ikon bila tidak ada alasan. Bila ikon tidak jelas
relevansinya, pakai label teks, bukan ikon.

## 9. Pemenuhan pesanan (konteks desain)

Tiga opsi pemenuhan, semuanya dirancang penuh:

1. **Diantar kurir instan** (Gosend/Grab). Dispatch dibuat manual/placeholder di
   tahap awal, alurnya tetap lengkap.
2. **Diantar penjual** (seller mengantar sendiri).
3. **Diambil sendiri oleh pembeli** di tempat seller.

Ongkos kirim tampil sebagai baris terpisah dan transparan sebelum pembayaran.

## 10. Aturan akun pembeli (konteks desain)

- Pesanan **lunas + ongkir** boleh dibuat **tanpa akun** (pembeli cukup memberi
  nomor WhatsApp dan alamat/ titik ambil).
- **COD mewajibkan akun pembeli dan KYC terverifikasi.** Ini ditampilkan jujur di
  alur: bila pembeli memilih COD tanpa akun/KYC, layar menuntun ke pendaftaran
  dan verifikasi, bukan gagal diam-diam.

## 11. Bahasa

Dua bahasa, Indonesia dan Inggris (`id` / `en`), dengan Indonesia sebagai
default. Semua teks UI disiapkan sebagai pasangan terjemahan, bukan string
tunggal.

## 12. Larangan yang dipegang (ringkas dari antislop)

- Tanpa em dash di teks mana pun (R-02).
- Tanpa angka, testimoni, logo, atau klaim keamanan yang tidak nyata
  (R-17, R-18, R-36, R-38). Kosong lebih baik daripada palsu.
- Setiap tombol/tautan punya perilaku nyata (R-26); setiap tampilan data punya
  state kosong, memuat, dan galat (R-27).
- Logo: sementara memakai wordmark teks "Tokowa" sebagai placeholder. Tidak
  mengarang logo tanpa arahan (R-23).

## 13. Logo

**Mark terpilih: Logo B "Kanopi warung".** Kanopi tiga lipatan yang
merangkup menjadi gelembung chat: jualan lokal + percakapan dalam satu bentuk.
Mark hidup sebagai vektor di `model.pen` (bengkel di frame "Logo B") dan sudah
dipasang kecil di topbar pembeli serta wordmark admin di `Z01` (lockup, versi
normal, mono, dan reversed).

- Pasangan mark: wordmark teks "Tokowa", Plus Jakarta Sans 800, tanpa tagline.
- Warna mark: `--accent #0F766E`, detail kanopi `--accent-bright #0E8C82`;
  mono `--ink`; reversed putih di atas `--accent`.
- Dua kandidat lain tersimpan sebagai arsip pembanding: Logo A "Pin
  percakapan" dan Logo C "Monogram T".
