---
name: security-test
description: >-
  Lakukan audit keamanan web (authorized) untuk aplikasi Next.js/React/Prisma:
  recon header & tech leak, mapping endpoint, CORS, brute-force/rate-limit &
  user enumeration, OTP/reset token (single-use, exposure), IDOR & eskalasi
  privilege, SQLi & stored XSS, path traversal, JWT alg-confusion & refresh
  reuse, info disclosure. Gunakan saat user meminta "test keamanan", "security
  test", "audit", "pentest", "cek vulnerabilitas", "GDPR/privacy check", atau
  menyebut OWASP. Selalu hanya untuk aplikasi milik user (authorized).
metadata:
  source: internal
---

# Security Test (Authorized Audit)

Audit keamanan **hanya untuk aplikasi milik user** (authorized). Tujuannya
menemukan & mendokumentasikan kerentanan, bukan mengeksploitasi destruktif.

## Aturan Main
- **No destructive exploitation**: jangan corrupt data, jangan kunci akun produksi,
  jangan hapus/ubah state permanen. Pakai *safe probe* (request terbatas, akun
  test, email palsu untuk enumerasi).
- Utamakan **code review statis** + **dynamic probe aman** (curl, grep).
- Untuk brute-force/rate-limit: kirim burst kecil (~20) ke email palsu; cukup
  untuk melihat ada/tidaknya `429`. Jangan target akun nyata berulang-ulang.
- Laporkan tiap temuan dengan severity, lokasi file:line, dampak, dan fix.
- Hasil akhir: tulat rencana remediasi ke `SECURITY-REMEDIATION.md` (bahasa Indonesia).

## Checklist & Cara Kerja (berurutan)

### 1. Recon — Header, Tech Leak, Endpoint, CORS
```bash
curl -sI https://DOMAIN/ | findstr /i "HTTP/ server: x-powered-by content-security-policy x-frame-options strict-transport-security x-content-type-options referrer-policy permissions-policy access-control"
curl -s -o nul -w "robots %{http_code}\n" https://DOMAIN/robots.txt
curl -s -o nul -w "llms %{http_code}\n" https://DOMAIN/llms.txt
curl -s -o nul -w "sitemap %{http_code}\n" https://DOMAIN/sitemap.xml
# CORS preflight
curl -s -i -X OPTIONS https://DOMAIN/api/XYZ -H "Origin: https://evil.example.com" | findstr /i "HTTP/ access-control"
```
- Header hilang (CSP/XFO/XCTO/RP) → catat MEDIUM.
- `Server`/`x-powered-by` bocor framework → tech leak (LOW).
- `access-control-allow-origin: *` → cek apakah endpoint mengembalikan data rahasia.

### 2. Auth — Rate-limit, Enumeration, Single-use, OTP/Reset
- Baca route `login`, `forgot-password`, `reset-password`, `register`, `verify`.
- **Rate-limit**: burst ~20 POST login ke email palsu → harap `429`. Bila tidak,
  catat (brute-force feasible, MEDIUM).
- **Enumeration**: bandingkan respon email ada vs tidak ada (pesan berbeda?),
  status `unverified` bocor? timing (`bcrypt` untuk user ada lebih lambat).
- **Single-use token**: di `db/users.ts` (`resetUserPassword`) — pastikan token
  di-null-kan setelah pakai + cek expiry. Token harus `crypto.randomBytes(32)`.
- **Reset exposure**: route tidak boleh membedakan token valid/kadaluarsa (respon
  generik 400).

### 3. IDOR & Eskalasi Privilege
- Grep ownership: `agent.userId !== userId`, `order.userId !== userId`,
  `agent.userId !== userId`. Pastikan tiap route resource punya pengecekan ini.
- **Register**: pastikan `role` tidak diambil dari body client (harus hardcode
  `"user"` atau dari server).
- **Admin backdoor**: cari email hardcode yang auto-promote (`SUPER_ADMIN_EMAILS`,
  `role === "admin"`). Sarankan pindah ke env.
- **Public endpoint**: pastikan tidak mengembalikan `systemPrompt`/knowledge/
  kredensial.

### 4. Injection — SQLi & Stored XSS
- **SQLi**: grep `queryRaw|executeRaw` → Pastikan pakai **tagged template Prisma**
  (`${var}` di-parameterize otomatis). Hindari string concatenation.
- **XSS**: grep `dangerouslySetInnerHTML`. Untuk tiap pemakaian:
  - Cek apakah input user di-render sebagai HTML tanpa sanitizer.
  - Pada parser markdown kustom: pastikan link menolak skema `javascript:`/
    `data:` dan quote di atribut tidak bisa memutus (jangan andalkan `&quot;`
    yang didekode parser).
  - Solusi: `react-markdown` + `rehype-raw` + `rehype-sanitize`, atau
    `sanitize-html`/`DOMPurify` di server.

### 5. Path Traversal
- grep `readFile|readFileSync|fs.read|createReadStream|path.join` di app code.
  Bila ada baca file dengan input user → validasi & batasi ke direktori aman.

### 6. JWT — Alg-confusion, Secret, Refresh
- Baca `auth-server.ts` (`verifyToken`/`signToken`):
  - Harus pin `algorithms: ["HS256"]` di verify & sign.
  - Jangan ada fallback secret diketahui (buang `"obrool-dev-secret"`); jika
    `JWT_SECRET` kosong → throw saat startup.
  - Cookie: `httpOnly`, `secure`(prod), `sameSite`.
- Cari mekanisme refresh token: bila ada, pastikan tidak bisa reuse (rotasi/
  blacklist). Bila tidak ada → catat "refresh reuse N/A".

### 7. CORS Abuse & Info Disclosure
- Endpoint dengan `Access-Control-Allow-Origin: *` → pastikan tidak mengembalikan
  data auth/session. Bila sensitive, batasi ke origin terdaftar.
- Verbose error: pastikan 500 mengembalikan pesan generik (tidak stack trace/
  query DB). Grep `console.error` di route (wajar) tapi pastikan respons user aman.

## Output Format
Akhiri dengan tabel:
| # | Temuan | Severity | Lokasi (file:line) |
Kontrol yang sudah benar → sebutkan sebagai positif (tidak diubah).

Lalu tulis `SECURITY-REMEDIATION.md` berisi rencana per-item (lokasi, approach fix,
test plan), diurutkan HIGH → MEDIUM → LOW. Jangan implementasi kecuali diminta.
