# Rencana Remediasi Keamanan Tokowa

Hasil audit authorized (statis + probe aman) tanggal 29 Okt 2026 terhadap
Tokowa.app dan endpoint obrool yang dipakainya. Status per 29 Okt 2026:
semua temuan HIGH (tidak ada), MEDIUM, dan LOW sudah diperbaiki dan
terverifikasi; file ini menjadi catatan.

## HIGH

Tidak ada temuan HIGH. Login ter-rate-limit, OTP/reset single-use, upload
divalidasi magic bytes, dan IDOR dijaga konsisten di semua route seller.

## MEDIUM (semua sudah diperbaiki)

### M1. Tokowa tanpa security headers → DIPERBAIKI
- Fix: `Tokowa.app/src/middleware.ts` (CSP, X-Frame-Options SAMEORIGIN,
  nosniff, Referrer-Policy, Permissions-Policy tanpa geolocation agar
  pemilih lokasi kurir tetap jalan, HSTS khusus produksi).
  `script-src 'unsafe-inline'` disengaja karena bootstrap inline Next.js;
  tidak ada `dangerouslySetInnerHTML` di repo sehingga risikonya rendah.
- Verifikasi: `curl -sI` memuat semua header; halaman 200 normal.

### M2. CORS `*` di endpoint login obrool yang mengembalikan token → DIPERBAIKI
- Fix: `D:\Project\obrool\src\app\api\auth\login\route.ts` hanya mengembalikan
  `Access-Control-Allow-Origin` bila `Origin` cocok dengan
  `CORS_ALLOWED_ORIGINS` (daftar koma, unset = same-origin saja). BFF Tokowa
  memanggil server-to-server sehingga tidak terpengaruh.
- Verifikasi: POST dari `Origin: evil.example.com` tanpa header ACAO;
  login via BFF tetap 200.

### M3. Dokumen KYC (KTP) di bucket R2 publik → DIPERBAIKI
- Fix: upload `kyc/file` kini mengembalikan object key (bukan URL publik);
  admin mengakses via `GET /api/v1/admin/kyc/file?key=` (auth role admin)
  yang mengalirkan byte dari R2 memakai kredensial server
  (`Cache-Control: private, no-store`). Menerima key `kyc/...` maupun URL
  R2 lama; URL eksternal dan `..` ditolak 400.
  Tokowa: form daftar menyimpan key; halaman admin verifikasi menautkan ke
  endpoint proxy, bukan URL mentah.
- Verifikasi (`uji-kyc-file.mjs`, 8/8): streaming 200 + byte identik, 401
  tanpa token, 400 traversal/eksternal, 404 key hilang. Objek uji dihapus
  dari R2 sesudahnya.

## LOW (semua sudah diperbaiki)

### L1. `X-Powered-By: Next.js` bocor → DIPERBAIKI
- Fix: `next.config.ts` → `poweredByHeader: false`. Verifikasi: header hilang.

### L2. Pesan reset-password membedakan token invalid vs kedaluwarsa → DIPERBAIKI
- Fix: kedua kasus kini memakai pesan identik di
  `D:\Project\obrool\src\lib\db\users.ts`.

### L3. Token JWT 7 hari tanpa rotasi → DIPERBAIKI (parsial)
- Fix: umur token kini dari env `JWT_EXPIRES_IN` (default `7d`) di
  `D:\Project\obrool\src\lib\auth-server.ts`, sehingga produksi bisa
  memperketat tanpa ubah kode. Rotasi refresh-token penuh belum dibangun.
- Test: `tsc` bersih; login via BFF 200.

### L4. Rate-limit waitlist in-memory per instance → DIPERBAIKI (parsial)
- Fix: respons 429 kini membawa `Retry-After: 3600`
  (`Tokowa.app/src/app/api/waitlist/route.ts`); terverifikasi request
  ke-11 → 429 + header. Persistensi lintas instance tetap PR bila
  disalahgunakan; terima untuk pra-launch.

## Positif (sudah benar, tidak diubah)

- Rate-limit login 10/15 mnt + pesan 401 identik untuk email tak dikenal,
  password salah, dan akun belum verifikasi (anti-enumerasi; terverifikasi via
  burst 12 request: 9×401 lalu 429).
- Register meng-hardcode `role: "user"`; password divalidasi server-side.
- Reset token sekali pakai + ada expiry.
- Semua route seller/admin v1 mengecek kepemilikan (`cekPemilikToko` /
  `agent.userId !== userId`); admin mengecek `role === "admin"` dari JWT
  bertanda tangan server.
- JWT pin `HS256` di sign dan verify; tanpa secret statis di production
  (efemeral + warning); cookie sesi `httpOnly`, `secure` di prod, `SameSite=Lax`.
- Upload bukti/KYC/foto: batas ukuran, allowlist tipe, validasi magic bytes,
  key acak, rate-limit.
- Tidak ada `dangerouslySetInnerHTML`, raw SQL, atau baca file dari input user
  di Tokowa.
- Error 500 generik ke klien; stack trace hanya di log server.
- `.env.local` tidak pernah masuk git; nilai secret tidak ada di riwayat
  (cek `git log -- .env.local` dan pencarian nilai kosong).
