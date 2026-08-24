/**
 * idGenerator.gs
 * Generate ID unik format: {PREFIX}-{yyyyMMdd}-{urutan 4 digit}
 * Contoh: EXP-20260816-0001
 *
 * Urutan dihitung dari jumlah baris existing pada tanggal yang sama +
 * random suffix pendek untuk menghindari race condition ekstrem
 * (LockService di service layer sudah menangani konkurensi utama).
 */

var ID_PREFIX = {
  USERS: 'USR',
  ACCOUNTS: 'ACC',
  CATEGORIES: 'CAT',
  INCOME: 'INC',
  EXPENSES: 'EXP',
  TRANSFERS: 'TRF',
  BUDGETS: 'BGT',
  INVESTMENTS: 'INV',
  DEBTS: 'DBT',
  DEBT_PAYMENTS: 'DBP',
  RECEIVABLES: 'RCV',
  RECEIVABLE_PAYMENTS: 'RCP',
  TRANSACTIONS: 'TRX',
  AUDIT_LOGS: 'LOG'
};

function generateId(sheetName) {
  var prefix = ID_PREFIX[sheetName];
  if (!prefix) throw new AppError_('INVALID_PREFIX', 'Tidak ada prefix ID untuk ' + sheetName);

  var datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMdd');
  var idFieldMap = {
    USERS: 'userId', ACCOUNTS: 'accountId', CATEGORIES: 'categoryId', INCOME: 'incomeId',
    EXPENSES: 'expenseId', TRANSFERS: 'transferId', BUDGETS: 'budgetId', INVESTMENTS: 'investmentId',
    DEBTS: 'debtId', DEBT_PAYMENTS: 'paymentId', RECEIVABLES: 'receivableId',
    RECEIVABLE_PAYMENTS: 'paymentId', TRANSACTIONS: 'transactionId', AUDIT_LOGS: 'logId'
  };
  var idField = idFieldMap[sheetName];
  var todayPrefix = prefix + '-' + datePart + '-';

  var rows = getAllRows(sheetName);
  var countToday = rows.filter(function (r) {
    return String(r[idField]).indexOf(todayPrefix) === 0;
  }).length;

  var seq = ('0000' + (countToday + 1)).slice(-4);
  var candidate = todayPrefix + seq;

  // Guard tambahan: pastikan benar-benar belum dipakai (jaga-jaga race condition).
  var exists = rows.some(function (r) { return r[idField] === candidate; });
  if (exists) {
    candidate = todayPrefix + seq + '-' + Math.floor(Math.random() * 900 + 100);
  }
  return candidate;
}
