# Frontend — Buku Kas (Keuangan Rumah Tangga)

Vanilla JS + HTML + CSS, single page app (hash routing), Chart.js untuk grafik.
Tidak butuh build step apapun — cukup file statis.

Bangun dulu backend nya di google script kamu

## 1. Sambungkan ke Backend
Buka `js/api.js`, ganti baris pertama:
```js
var API_BASE_URL = 'GANTI_DENGAN_WEB_APP_URL_KAMU';
```
dengan Web App URL dari deployment Apps Script kamu (lihat `apps-script/README.md`).

## 2. Cara Menjalankan

**Opsi A — Buka langsung (paling cepat untuk coba-coba)**
Klik dua kali `index.html`. Catatan: beberapa browser membatasi `fetch()` dari
file lokal (`file://`) ke domain lain. Kalau login gagal terus/loading tanpa
error jelas, pakai Opsi B.

**Opsi B — Server statis lokal (disarankan)**
```bash
cd frontend
python3 -m http.server 8080
```
lalu buka `http://localhost:8080`.

**Opsi C — Hosting gratis (disarankan untuk pemakaian harian)**
Upload folder `frontend/` ke GitHub Pages, Netlify, atau Vercel (drag & drop).
Karena ini murni file statis, semua hosting gratis di atas bisa langsung pakai
tanpa konfigurasi tambahan.

## 3. Login
Gunakan username & password yang kamu buat lewat `createUser()` di Apps Script
(lihat `apps-script/README.md` langkah 2.4). Ini BUKAN akun Google kamu.

## 4. Struktur Halaman
- **Dashboard** — Net worth, saldo total, income/expense bulan ini, cash flow,
  daftar kantong, progress budget, chart income vs expense
- **Income / Expense** — daftar transaksi + total bulan berjalan
- **Budget Bulanan** — pilih bulan/tahun, lihat actual vs budget per kategori,
  tambah budget baru
- **Investasi** — daftar tabungan uang & emas, tombol **Update Harga Emas**
  (re-valuasi otomatis semua investasi emas aktif)
- **Utang & Piutang** — daftar + tombol bayar/terima pembayaran
- **Kantong** — semua akun, klik untuk lihat histori transaksi per akun
- **Transfer** — histori perpindahan dana antar kantong
- **Laporan** — 5 chart: income/expense, expense per kategori, saldo per
  kantong, cash flow, tren net worth

Tombol **+** (kanan bawah) membuka form cepat untuk 6 jenis transaksi.

## 5. Kalau Ada Error "Sesi habis" Terus-terusan
Cek apakah token di localStorage browser (`hf_token`) masih ada — buka DevTools
> Application > Local Storage. Kalau backend baru saja di-redeploy dengan versi
baru dan URL berubah, pastikan `API_BASE_URL` di `js/api.js` sudah yang terbaru.

## 6. Menambah Kategori Baru
Belum ada UI khusus untuk tambah kategori di versi ini (sengaja disederhanakan
dulu). Untuk sementara tambah langsung lewat Google Sheet di tab CATEGORIES,
atau panggil `createCategory_()` lewat Apps Script editor. Bisa saya tambahkan
UI-nya kalau dibutuhkan.
