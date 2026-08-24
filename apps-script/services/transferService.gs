/**
 * transferService.gs
 * Transfer TIDAK dihitung sebagai income/expense. Net asset tetap sama.
 * Ditulis sebagai 2 baris ledger (TRANSFER_OUT + TRANSFER_IN) dalam satu
 * batch insert supaya konsisten (tidak ada state "setengah jalan").
 */

function createTransfer(userId, payload) {
  requireFields_(payload, ['date', 'fromAccountId', 'toAccountId', 'amount']);
  var amount = validateAmount_(payload.amount);
  validateDate_(payload.date);
  if (payload.fromAccountId === payload.toAccountId) {
    throw new AppError_('SAME_ACCOUNT', 'Account asal dan tujuan tidak boleh sama.');
  }
  validateAccountActive_(payload.fromAccountId);
  validateAccountActive_(payload.toAccountId);

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    validateSufficientBalance_(payload.fromAccountId, amount);

    var transfer = {
      transferId: generateId('TRANSFERS'),
      userId: userId,
      date: payload.date,
      fromAccountId: payload.fromAccountId,
      toAccountId: payload.toAccountId,
      amount: amount,
      description: payload.description || '',
      status: STATUS.ACTIVE,
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    };
    insertRow(SHEET_NAMES.TRANSFERS, transfer);

    // Ditulis dalam satu batch call agar tidak ada kondisi "OUT berhasil, IN gagal".
    writeLedgerEntries_([
      { userId: userId, date: payload.date, type: TX_TYPE.TRANSFER_OUT, referenceId: transfer.transferId, accountId: payload.fromAccountId, amount: amount, description: payload.description },
      { userId: userId, date: payload.date, type: TX_TYPE.TRANSFER_IN, referenceId: transfer.transferId, accountId: payload.toAccountId, amount: amount, description: payload.description }
    ]);

    logAudit_(userId, 'CREATE', 'TRANSFERS', transfer.transferId, null, transfer);
    return transfer;
  } finally {
    lock.releaseLock();
  }
}

function listTransfers(filters) {
  var rows = getAllRows(SHEET_NAMES.TRANSFERS);
  if (filters && filters.accountId) {
    rows = rows.filter(function (r) { return r.fromAccountId === filters.accountId || r.toAccountId === filters.accountId; });
  }
  rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  return rows.map(withoutRowMeta_);
}

function reverseTransfer(userId, transferId, reason) {
  return reverseByReference_(SHEET_NAMES.TRANSFERS, 'transferId', transferId, userId, reason);
}
