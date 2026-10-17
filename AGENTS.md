# AGENTS.md — Tokowa.app

Petunjuk untuk agen coding di repo ini.

## Konteks proyek

Tokowa.app adalah frontend marketplace (Next.js App Router) yang memanggil API
backend **obrool** (`D:\Project\obrool`). Belanja inti berjalan lewat chat
WhatsApp pada satu nomor platform; bot mencocokkan produk ke seller terdekat.
Arah brand dan sistem visual ada di `DESIGN.md`.

## Peta dokumen

- `DESIGN.md` — arah brand, palet, tipografi, dial, motif, aturan pemenuhan.
- `docs/rencana-kontrak-api.md` — rencana kontrak API Tokowa ↔ obrool
  (pembagian tanggung jawab, endpoint, webhooks, fase implementasi).
- `antislop.md` dan `skills/` — filter desain/kode teks (lihat di bawah).

<!-- antislop:start -->
## antislop
Untuk pekerjaan UI, teks/copy, aksesibilitas, layout mobile, atau komentar kode,
baca `.agents/skills/antislop/SKILL.md` (inti) lalu skill sesuai tugas:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Copy & teks: `.agents/skills/antislop-copywriting/SKILL.md`
- Aksesibilitas (people): `.agents/skills/antislop-human/SKILL.md`
- Layout mobile: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Komentar kode: `.agents/skills/antislop-code/SKILL.md`
Mode penggunaan: **DURING** (diterapkan saat bekerja), diakhiri Delivery Gate.
<!-- antislop:end -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
