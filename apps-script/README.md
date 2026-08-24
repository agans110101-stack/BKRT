# Backend — Aplikasi Keuangan Rumah Tangga (Google Apps Script + Sheets)

## 1. Setup Spreadsheet
1. Buat Google Spreadsheet baru, kosongkan namanya jadi mis. "Household Finance DB".
2. Salin **Spreadsheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/`**`INI_ID_NYA`**`/edit`
3. Buka **Extensions > Apps Script** dari spreadsheet tsb.
4. Hapus isi default `Code.gs`, lalu buat file-file berikut persis sesuai nama & isi di folder `apps-script/` ini:
   - `config.gs`, `utils.gs`, `validation.gs`, `auth.gs`, `idGenerator.gs`, `router.gs`, `Code.gs`
   - `db/dbHelper.gs`
   - `services/accountService.gs`, `incomeService.gs`, `expenseService.gs`, `transferService.gs`,
     `budgetService.gs`, `investmentService.gs`, `debtService.gs`, `receivableService.gs`,
     `transactionService.gs`, `dashboardService.gs`, `reportService.gs`

   (Di Apps Script editor semua file otomatis "flat" di satu project meskipun kamu beri nama
   dengan folder seperti `db/dbHelper` — itu tidak masalah, Apps Script tidak punya folder
   sungguhan, hanya nama file. Kamu bisa beri nama `dbHelper`, `accountService`, dst.)

5. Buka `config.gs`, ganti:
   ```js
   var SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU';
   ```
   dengan ID dari langkah 2.

## 2. Inisialisasi Database
Di editor Apps Script, jalankan fungsi-fungsi ini **satu per satu** (pilih fungsi di dropdown atas, klik Run):

1. `setupDatabase()` — membuat 15 sheet + header.
2. `seedInitialAccounts()` — mengisi 6 akun awal (CASH, BSI, BLU GETHER, dst).
3. `seedCategories()` — mengisi 11 kategori expense + 6 kategori income.
4. Buat akun login pertama kamu lewat **Run > createUser**, tapi karena butuh
   parameter, jalankan lewat tab **Execution log** atau tambahkan sementara di
   akhir `Code.gs`:
   ```js
   function _initUser() {
     createUser('Nama Kamu', 'username_kamu', 'password_rahasia', 'OWNER');
   }
   ```
   lalu jalankan `_initUser()`, setelah itu **hapus/comment fungsi ini** supaya
   tidak ada yang bisa membuat user baru sembarangan.

Otorisasi izin akan diminta saat pertama kali run — klik **Allow**.

## 3. Deploy sebagai Web App
1. Klik **Deploy > New deployment**.
2. Pilih tipe **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone with the link** (karena frontend akan diakses lewat browser tanpa login Google).
5. Klik **Deploy**, salin **Web App URL** yang muncul — ini yang dipakai di `frontend/js/api.js`.

## 4. Catatan Penting soal CORS
Google Apps Script Web App **tidak bisa** menangani custom preflight (OPTIONS)
request. Supaya browser tidak memicu preflight saat POST, frontend WAJIB
mengirim body dengan header:
```
Content-Type: text/plain;charset=utf-8
```
walau isinya string JSON. Backend (`router.gs`) sudah menangani ini di
`parseParams_()` — ia mem-parse `e.postData.contents` sebagai JSON secara manual.

## 5. Testing
Jalankan `runTestCases_()` di editor **HANYA di spreadsheet development/testing**
(bukan data asli kamu), lalu cek **View > Logs** untuk hasil PASS/FAIL dari 8
skenario di spesifikasi awal (income, expense, transfer, saldo kurang, budget,
investasi emas, utang, piutang).

## 6. Tiap kali redeploy
Karena Web App URL bisa berubah tiap kali "New deployment", gunakan
**Deploy > Manage deployments > Edit (pensil) > New version** supaya URL tetap
sama setiap kali kamu update kode.
