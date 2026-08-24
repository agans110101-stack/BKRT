/**
 * validation.gs
 * Semua validasi finansial WAJIB lewat sini. Jangan percaya data dari frontend.
 * Melempar AppError_ jika tidak valid -> ditangkap router dan dikembalikan
 * sebagai errorResponse_.
 */

function validateAmount_(amount) {
  var n = toNumber_(amount);
  if (!(n > 0)) {
    throw new AppError_('INVALID_AMOUNT', 'Jumlah harus lebih besar dari 0.');
  }
  return n;
}

function validateDate_(dateStr) {
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new AppError_('INVALID_DATE', 'Tanggal tidak valid.');
  }
  return d;
}

function validateAccountActive_(accountId) {
  var acc = findById(SHEET_NAMES.ACCOUNTS, 'accountId', accountId);
  if (!acc) throw new AppError_('ACCOUNT_NOT_FOUND', 'Account ' + accountId + ' tidak ditemukan.');
  if (acc.isActive === false || acc.isActive === 'FALSE') {
    throw new AppError_('ACCOUNT_INACTIVE', 'Account ' + acc.name + ' sudah tidak aktif.');
  }
  return acc;
}

function validateCategory_(categoryId, expectedType) {
  var cat = findById(SHEET_NAMES.CATEGORIES, 'categoryId', categoryId);
  if (!cat) throw new AppError_('CATEGORY_NOT_FOUND', 'Kategori ' + categoryId + ' tidak ditemukan.');
  if (expectedType && cat.type !== expectedType) {
    throw new AppError_('CATEGORY_TYPE_MISMATCH', 'Kategori ' + cat.name + ' bukan kategori ' + expectedType + '.');
  }
  return cat;
}

function validateSufficientBalance_(accountId, amount) {
  var balance = calculateAccountBalance(accountId);
  if (balance < amount) {
    var acc = findById(SHEET_NAMES.ACCOUNTS, 'accountId', accountId);
    throw new AppError_('INSUFFICIENT_BALANCE', 'Saldo ' + (acc ? acc.name : accountId) + ' tidak mencukupi untuk transaksi ini.');
  }
  return balance;
}

function requireFields_(payload, fields) {
  fields.forEach(function (f) {
    if (payload[f] === undefined || payload[f] === null || payload[f] === '') {
      throw new AppError_('MISSING_FIELD', 'Field "' + f + '" wajib diisi.');
    }
  });
}
