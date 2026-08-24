/**
 * Code.gs
 * Jalankan fungsi-fungsi berikut SATU KALI lewat editor Apps Script
 * (bukan lewat Web App) untuk inisialisasi:
 *   1. setupDatabase()
 *   2. seedInitialAccounts()
 *   3. seedCategories()
 *   4. createUser('Nama Kamu', 'username_kamu', 'password_kamu', 'OWNER')
 * Baru setelah itu deploy sebagai Web App (Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone with the link).
 */

function setupDatabase() {
  var ss = getSpreadsheet_();
  Object.keys(SHEET_NAMES).forEach(function (key) {
    var name = SHEET_NAMES[key];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    var headers = SHEET_HEADERS[key];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });

  // Hapus sheet default "Sheet1" jika masih ada dan kosong.
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('Database setup selesai. Total sheet: ' + ss.getSheets().length);
}

function seedInitialAccounts() {
  var existing = getAllRows(SHEET_NAMES.ACCOUNTS);
  if (existing.length > 0) {
    Logger.log('ACCOUNTS sudah berisi data, seed dilewati.');
    return;
  }

  var accountNames = ['CASH', 'BSI', 'BLU GETHER', 'BLU GANI', 'BLU SAVING', 'TWINLINE BLU'];
  var typeMap = { CASH: 'Cash', BSI: 'Bank Account', 'BLU GETHER': 'Bank Account', 'BLU GANI': 'Bank Account', 'BLU SAVING': 'Bank Account', 'TWINLINE BLU': 'Bank Account' };

  accountNames.forEach(function (name) {
    insertRow(SHEET_NAMES.ACCOUNTS, {
      accountId: generateId('ACCOUNTS'),
      userId: 'default',
      name: name,
      type: typeMap[name],
      initialBalance: 0,
      currency: 'IDR',
      description: '',
      isActive: true,
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    });
  });
  Logger.log('Seed ' + accountNames.length + ' account selesai.');
}

function seedCategories() {
  var existing = getAllRows(SHEET_NAMES.CATEGORIES);
  if (existing.length > 0) {
    Logger.log('CATEGORIES sudah berisi data, seed dilewati.');
    return;
  }

  var expenseCategories = [
    'Groceries', 'Jajan', 'Transportasi', 'Perlengkapan Rumah Tangga', 'Peralatan Rumah Tangga',
    'Tagihan & Utilitas', 'Belanja & Gaya Hidup', 'Kesehatan', 'Pendidikan', 'Sosial & Donasi',
    'Hiburan', 'Bisnis', 'Lain Lain'
  ];
  var incomeCategories = [
    'Gaji', 'Bonus / THR', 'Usaha / Bisnis', 'Hasil Investasi', 'Hadiah / Pemberian', 'Lain-lain'
  ];

  expenseCategories.forEach(function (name) { insertCategory_(name, 'EXPENSE'); });
  incomeCategories.forEach(function (name) { insertCategory_(name, 'INCOME'); });

  Logger.log('Seed ' + (expenseCategories.length + incomeCategories.length) + ' kategori selesai.');
}

function insertCategory_(name, type) {
  insertRow(SHEET_NAMES.CATEGORIES, {
    categoryId: generateId('CATEGORIES'),
    userId: 'default',
    name: name,
    type: type,
    icon: '',
    color: '',
    isActive: true,
    createdAt: nowIso_(),
    updatedAt: nowIso_()
  });
}

/**
 * Migrasi kategori EXPENSE ke daftar baru, AMAN dijalankan di spreadsheet
 * yang SUDAH punya transaksi (rename, bukan hapus, jadi categoryId lama
 * yang sudah dipakai di EXPENSES/BUDGETS tidak jadi yatim).
 * Jalankan SATU KALI lewat editor Apps Script: migrateExpenseCategoriesV2()
 */
function migrateExpenseCategoriesV2() {
  renameCategoryIfExists_('Makanan & Minuman', 'Groceries');
  renameCategoryIfExists_('Rumah Tangga', 'Perlengkapan Rumah Tangga');
  renameCategoryIfExists_('Lain-lain', 'Lain Lain');
  addCategoryIfMissing_('Jajan', 'EXPENSE');
  addCategoryIfMissing_('Peralatan Rumah Tangga', 'EXPENSE');
  Logger.log('Migrasi kategori expense selesai.');
}

function renameCategoryIfExists_(oldName, newName) {
  var cat = findRows(SHEET_NAMES.CATEGORIES, { name: oldName, type: 'EXPENSE' })[0];
  if (cat) {
    updateRow(SHEET_NAMES.CATEGORIES, 'categoryId', cat.categoryId, { name: newName, updatedAt: nowIso_() });
    Logger.log('Rename: ' + oldName + ' -> ' + newName);
  } else {
    Logger.log('Lewati rename (tidak ditemukan): ' + oldName);
  }
}

function addCategoryIfMissing_(name, type) {
  var existing = findRows(SHEET_NAMES.CATEGORIES, { name: name, type: type });
  if (existing.length) { Logger.log('Sudah ada: ' + name); return; }
  insertCategory_(name, type);
  Logger.log('Tambah kategori baru: ' + name);
}

/**
 * Migrasi fitur Infaq: nambah kolom "infaqStatus" di sheet INCOME (kolom
 * baru di akhir, TIDAK menggeser kolom lain -> aman untuk data lama).
 * Baris lama yang belum punya nilai di-backfill jadi NOT_YET (kamu bisa
 * tandai manual jadi DONE kalau income lama itu sebenarnya sudah diinfaqkan).
 * Jalankan SATU KALI: migrateIncomeInfaqColumn()
 */
function migrateIncomeInfaqColumn() {
  var sheet = getSheet(SHEET_NAMES.INCOME);
  var headers = SHEET_HEADERS.INCOME;

  // Pastikan header row sesuai definisi terbaru (termasuk infaqStatus di akhir).
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log('INCOME masih kosong, tidak ada yang di-backfill.'); return; }

  var infaqCol = headers.indexOf('infaqStatus') + 1; // 1-indexed
  var range = sheet.getRange(2, infaqCol, lastRow - 1, 1);
  var values = range.getValues();
  var updated = 0;
  for (var i = 0; i < values.length; i++) {
    if (!values[i][0]) { values[i][0] = 'NOT_YET'; updated++; }
  }
  range.setValues(values);
  Logger.log('Migrasi infaq selesai. Baris di-backfill jadi NOT_YET: ' + updated);
}

/**
 * Dummy data untuk testing manual. AMAN dijalankan berkali-kali di
 * spreadsheet development terpisah -- jangan dijalankan di data produksi.
 */
function seedSampleData_forTestingOnly() {
  var user = getAllRows(SHEET_NAMES.USERS)[0];
  if (!user) { Logger.log('Buat user dulu dengan createUser().'); return; }
  var userId = user.userId;

  var bsi = findRows(SHEET_NAMES.ACCOUNTS, { name: 'BSI' })[0];
  var cash = findRows(SHEET_NAMES.ACCOUNTS, { name: 'CASH' })[0];
  var gaji = findRows(SHEET_NAMES.CATEGORIES, { name: 'Gaji' })[0];
  var makanan = findRows(SHEET_NAMES.CATEGORIES, { name: 'Makanan & Minuman' })[0];

  createIncome(userId, { date: '2026-08-01', amount: 5000000, source: 'Kantor', categoryId: gaji.categoryId, accountId: bsi.accountId, description: 'Gaji Agustus' });
  createExpense(userId, { date: '2026-08-02', amount: 50000, categoryId: makanan.categoryId, accountId: bsi.accountId, description: 'Makan siang' });
  createTransfer(userId, { date: '2026-08-03', fromAccountId: bsi.accountId, toAccountId: cash.accountId, amount: 1000000, description: 'Ambil tunai' });

  Logger.log('Sample data berhasil dibuat.');
}

/**
 * Jalankan fungsi ini untuk verifikasi 8 test case di spesifikasi.
 * Baca hasilnya di View > Logs (Ctrl+Enter di editor).
 * CATATAN: jalankan di spreadsheet TERPISAH khusus testing, karena ini
 * membuat transaksi sungguhan.
 */
function runTestCases_() {
  var user = getAllRows(SHEET_NAMES.USERS)[0];
  if (!user) { Logger.log('Buat user dulu dengan createUser().'); return; }
  var userId = user.userId;

  var bsi = findRows(SHEET_NAMES.ACCOUNTS, { name: 'BSI' })[0];
  var cash = findRows(SHEET_NAMES.ACCOUNTS, { name: 'CASH' })[0];
  var gaji = findRows(SHEET_NAMES.CATEGORIES, { name: 'Gaji' })[0];
  var makanan = findRows(SHEET_NAMES.CATEGORIES, { name: 'Makanan & Minuman' })[0];

  // Test 1: Income Rp5jt ke BSI
  var balBefore1 = calculateAccountBalance(bsi.accountId);
  createIncome(userId, { date: '2026-08-16', amount: 5000000, categoryId: gaji.categoryId, accountId: bsi.accountId, description: 'Test1' });
  assert_(calculateAccountBalance(bsi.accountId) === balBefore1 + 5000000, 'Test 1: Income BSI +5jt');

  // Test 2: Expense Rp100rb dari BSI
  var balBefore2 = calculateAccountBalance(bsi.accountId);
  createExpense(userId, { date: '2026-08-16', amount: 100000, categoryId: makanan.categoryId, accountId: bsi.accountId, description: 'Test2' });
  assert_(calculateAccountBalance(bsi.accountId) === balBefore2 - 100000, 'Test 2: Expense BSI -100rb');

  // Test 3: Transfer BSI -> CASH Rp1jt, total asset tetap
  var totalBefore3 = calculateAccountBalance(bsi.accountId) + calculateAccountBalance(cash.accountId);
  createTransfer(userId, { date: '2026-08-16', fromAccountId: bsi.accountId, toAccountId: cash.accountId, amount: 1000000, description: 'Test3' });
  var totalAfter3 = calculateAccountBalance(bsi.accountId) + calculateAccountBalance(cash.accountId);
  assert_(totalAfter3 === totalBefore3, 'Test 3: Transfer, total asset tetap');

  // Test 4: Expense lebih besar dari saldo -> harus ditolak
  var rejected = false;
  try {
    createExpense(userId, { date: '2026-08-16', amount: 999999999999, categoryId: makanan.categoryId, accountId: cash.accountId, description: 'Test4' });
  } catch (e) {
    rejected = (e.code === 'INSUFFICIENT_BALANCE');
  }
  assert_(rejected, 'Test 4: Expense > saldo ditolak');

  // Test 6: Investasi emas Rp500rb, bukan expense
  var expenseCountBefore = findRows(SHEET_NAMES.EXPENSES, {}).length;
  createInvestment(userId, { date: '2026-08-16', name: 'Emas Test', type: 'GOLD', accountId: bsi.accountId, amount: 500000, goldWeight: 1, pricePerGram: 500000 });
  var expenseCountAfter = findRows(SHEET_NAMES.EXPENSES, {}).length;
  assert_(expenseCountBefore === expenseCountAfter, 'Test 6: Investasi emas tidak masuk EXPENSES');

  // Test 7: Debt 1jt, bayar 400rb -> remaining 600rb
  var debt = createDebt(userId, { personName: 'Test Person', totalAmount: 1000000, date: '2026-08-16' });
  createDebtPayment(userId, { debtId: debt.debtId, date: '2026-08-16', amount: 400000, accountId: bsi.accountId });
  var debtAfter = findById(SHEET_NAMES.DEBTS, 'debtId', debt.debtId);
  assert_(Number(debtAfter.remainingAmount) === 600000, 'Test 7: Sisa utang 600rb');

  // Test 8: Receivable 1jt, diterima 1jt -> remaining 0
  var recv = createReceivable(userId, { personName: 'Test Person', totalAmount: 1000000, date: '2026-08-16', accountId: bsi.accountId });
  createReceivablePayment(userId, { receivableId: recv.receivableId, date: '2026-08-16', amount: 1000000, accountId: bsi.accountId });
  var recvAfter = findById(SHEET_NAMES.RECEIVABLES, 'receivableId', recv.receivableId);
  assert_(Number(recvAfter.remainingAmount) === 0 && recvAfter.status === 'PAID', 'Test 8: Piutang lunas');

  Logger.log('SEMUA TEST SELESAI DIJALANKAN. Cek log di atas untuk hasil PASS/FAIL.');
}

function assert_(condition, label) {
  Logger.log((condition ? '✅ PASS - ' : '❌ FAIL - ') + label);
}
