/**
 * incomeService.gs
 * Infaq: setiap income baru otomatis kena kewajiban infaq 2.5% dari jumlah,
 * default status NOT_YET. Nominal infaq TIDAK disimpan (dihitung on-the-fly
 * dari amount*0.025) supaya tidak basi kalau ada koreksi; yang disimpan
 * cuma status togglenya (NOT_YET/DONE).
 */

var INFAQ_RATE = 0.025;

function createIncome(userId, payload) {
  requireFields_(payload, ['date', 'amount', 'categoryId', 'accountId']);
  var amount = validateAmount_(payload.amount);
  validateDate_(payload.date);
  validateAccountActive_(payload.accountId);
  validateCategory_(payload.categoryId, 'INCOME');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var income = {
      incomeId: generateId('INCOME'),
      userId: userId,
      date: payload.date,
      amount: amount,
      source: payload.source || '',
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      description: payload.description || '',
      status: STATUS.ACTIVE,
      createdAt: nowIso_(),
      updatedAt: nowIso_(),
      infaqStatus: 'NOT_YET'
    };
    insertRow(SHEET_NAMES.INCOME, income);
    writeLedgerEntry_(userId, payload.date, TX_TYPE.INCOME, income.incomeId, payload.accountId, amount, payload.categoryId, payload.description);
    logAudit_(userId, 'CREATE', 'INCOME', income.incomeId, null, income);
    return income;
  } finally {
    lock.releaseLock();
  }
}

function listIncome(filters) {
  var rows = findRows(SHEET_NAMES.INCOME, filters && filters.accountId ? { accountId: filters.accountId } : null);
  rows = rows.filter(function (r) { return r.status !== STATUS.REVERSED || (filters && filters.includeReversed); });
  if (filters && filters.month && filters.year) {
    rows = rows.filter(function (r) { return isSameMonth_(r.date, filters.month, filters.year); });
  }
  rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  return rows.map(withoutRowMeta_);
}

function reverseIncome(userId, incomeId, reason) {
  return reverseByReference_(SHEET_NAMES.INCOME, 'incomeId', incomeId, userId, reason);
}

/** Tandai satu income sudah/belum diinfaqkan. status: 'DONE' | 'NOT_YET' */
function markIncomeInfaqStatus(userId, incomeId, status) {
  if (status !== 'DONE' && status !== 'NOT_YET') {
    throw new AppError_('INVALID_STATUS', 'Status infaq harus DONE atau NOT_YET.');
  }
  var income = findById(SHEET_NAMES.INCOME, 'incomeId', incomeId);
  if (!income) throw new AppError_('NOT_FOUND', 'Income tidak ditemukan.');

  var updated = updateRow(SHEET_NAMES.INCOME, 'incomeId', incomeId, { infaqStatus: status, updatedAt: nowIso_() });
  logAudit_(userId, 'UPDATE_INFAQ_STATUS', 'INCOME', incomeId, { infaqStatus: income.infaqStatus }, { infaqStatus: status });
  return withoutRowMeta_(updated);
}

/** Ringkasan kewajiban infaq dari seluruh income aktif yang belum diinfaqkan. */
function getInfaqSummary() {
  var rows = findRows(SHEET_NAMES.INCOME, { status: STATUS.ACTIVE });
  var notYet = rows.filter(function (r) { return r.infaqStatus !== 'DONE'; });
  var totalIncomeNotYet = sumBy_(notYet, 'amount');
  return {
    countNotYet: notYet.length,
    totalIncomeNotYet: totalIncomeNotYet,
    totalInfaqOwed: totalIncomeNotYet * INFAQ_RATE
  };
}
