/**
 * transactionService.gs
 * Semua service lain menulis histori lewat writeLedgerEntry_() / writeLedgerEntries_()
 * supaya TRANSACTIONS selalu jadi single source of truth untuk kalkulasi saldo.
 */

function writeLedgerEntry_(userId, date, type, referenceId, accountId, amount, categoryId, description) {
  insertRow(SHEET_NAMES.TRANSACTIONS, {
    transactionId: generateId('TRANSACTIONS'),
    userId: userId,
    date: date,
    type: type,
    referenceId: referenceId,
    accountId: accountId,
    amount: amount,
    categoryId: categoryId || '',
    description: description || '',
    createdAt: nowIso_()
  });
}

function writeLedgerEntries_(entries) {
  var rows = entries.map(function (e) {
    return {
      transactionId: generateId('TRANSACTIONS'),
      userId: e.userId,
      date: e.date,
      type: e.type,
      referenceId: e.referenceId,
      accountId: e.accountId,
      amount: e.amount,
      categoryId: e.categoryId || '',
      description: e.description || '',
      createdAt: nowIso_()
    };
  });
  insertRows(SHEET_NAMES.TRANSACTIONS, rows);
}

function listTransactions(filters) {
  var f = {};
  if (filters) {
    if (filters.accountId) f.accountId = filters.accountId;
    if (filters.type) f.type = filters.type;
    if (filters.categoryId) f.categoryId = filters.categoryId;
  }
  var rows = findRows(SHEET_NAMES.TRANSACTIONS, f);

  if (filters && filters.dateFrom) {
    rows = rows.filter(function (r) { return new Date(r.date) >= new Date(filters.dateFrom); });
  }
  if (filters && filters.dateTo) {
    rows = rows.filter(function (r) { return new Date(r.date) <= new Date(filters.dateTo); });
  }
  if (filters && filters.search) {
    var q = String(filters.search).toLowerCase();
    rows = rows.filter(function (r) { return String(r.description).toLowerCase().indexOf(q) !== -1; });
  }

  rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  return rows.map(withoutRowMeta_);
}

/**
 * Membalik transaksi berdasarkan record asal (mis. expenseId), BUKAN
 * menghapus baris. Menulis entry ledger kebalikan + menandai record asal
 * sebagai REVERSED. Lihat aturan #31 di spec.
 */
function reverseByReference_(sourceSheetName, idField, id, userId, reason) {
  var record = findById(sourceSheetName, idField, id);
  if (!record) throw new AppError_('NOT_FOUND', 'Data tidak ditemukan untuk dibalik.');
  if (record.status === STATUS.REVERSED) {
    throw new AppError_('ALREADY_REVERSED', 'Data ini sudah pernah dibalik sebelumnya.');
  }

  var ledgerEntries = findRows(SHEET_NAMES.TRANSACTIONS, { referenceId: id });
  var reversedEntries = ledgerEntries.map(function (e) {
    return {
      userId: userId,
      date: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd'),
      type: e.type,
      referenceId: id + '-REVERSAL',
      accountId: e.accountId,
      amount: -toNumber_(e.amount), // nilai negatif = kebalikan efek asal
      categoryId: e.categoryId,
      description: 'Reversal: ' + (reason || record.description || '')
    };
  });
  writeLedgerEntries_(reversedEntries);

  updateRow(sourceSheetName, idField, id, { status: STATUS.REVERSED, updatedAt: nowIso_() });
  logAudit_(userId, 'REVERSE', sourceSheetName, id, record, { status: STATUS.REVERSED, reason: reason });

  return { reversed: true, id: id };
}
