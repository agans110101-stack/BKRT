/**
 * receivableService.gs
 * Memberi piutang = uang keluar dari account, tapi bukan expense konsumtif
 * (dicatat sebagai TX_TYPE.RECEIVABLE, jadi tetap mengurangi saldo).
 * Saat piutang dibayar kembali, saldo account bertambah.
 */

function createReceivable(userId, payload) {
  requireFields_(payload, ['personName', 'totalAmount', 'date', 'accountId']);
  var amount = validateAmount_(payload.totalAmount);
  validateDate_(payload.date);
  validateAccountActive_(payload.accountId);

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    validateSufficientBalance_(payload.accountId, amount);

    var receivable = {
      receivableId: generateId('RECEIVABLES'),
      userId: userId,
      personName: payload.personName,
      totalAmount: amount,
      remainingAmount: amount,
      date: payload.date,
      dueDate: payload.dueDate || '',
      status: 'UNPAID',
      description: payload.description || '',
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    };
    insertRow(SHEET_NAMES.RECEIVABLES, receivable);
    writeLedgerEntry_(userId, payload.date, TX_TYPE.RECEIVABLE, receivable.receivableId, payload.accountId, amount, '', 'Piutang ke ' + payload.personName);
    logAudit_(userId, 'CREATE', 'RECEIVABLES', receivable.receivableId, null, receivable);
    return receivable;
  } finally {
    lock.releaseLock();
  }
}

function createReceivablePayment(userId, payload) {
  requireFields_(payload, ['receivableId', 'date', 'amount', 'accountId']);
  var amount = validateAmount_(payload.amount);
  validateDate_(payload.date);
  validateAccountActive_(payload.accountId);

  var receivable = findById(SHEET_NAMES.RECEIVABLES, 'receivableId', payload.receivableId);
  if (!receivable) throw new AppError_('RECEIVABLE_NOT_FOUND', 'Data piutang tidak ditemukan.');
  if (amount > toNumber_(receivable.remainingAmount)) {
    throw new AppError_('OVERPAYMENT', 'Jumlah melebihi sisa piutang (Rp' + receivable.remainingAmount + ').');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var payment = {
      paymentId: generateId('RECEIVABLE_PAYMENTS'),
      receivableId: payload.receivableId,
      userId: userId,
      date: payload.date,
      amount: amount,
      accountId: payload.accountId,
      description: payload.description || '',
      status: STATUS.ACTIVE,
      createdAt: nowIso_()
    };
    insertRow(SHEET_NAMES.RECEIVABLE_PAYMENTS, payment);
    writeLedgerEntry_(userId, payload.date, TX_TYPE.RECEIVABLE_PAYMENT, payment.paymentId, payload.accountId, amount, '', 'Terima piutang dari ' + receivable.personName);

    var newRemaining = toNumber_(receivable.remainingAmount) - amount;
    var newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';
    updateRow(SHEET_NAMES.RECEIVABLES, 'receivableId', payload.receivableId, { remainingAmount: newRemaining, status: newStatus, updatedAt: nowIso_() });

    logAudit_(userId, 'CREATE', 'RECEIVABLE_PAYMENTS', payment.paymentId, null, payment);
    return payment;
  } finally {
    lock.releaseLock();
  }
}

function listReceivables() {
  var rows = getAllRows(SHEET_NAMES.RECEIVABLES);
  markOverdue_(rows, 'dueDate', 'status', ['UNPAID', 'PARTIAL']);
  return rows.map(withoutRowMeta_);
}

function getTotalReceivable() {
  var rows = findRows(SHEET_NAMES.RECEIVABLES, null).filter(function (r) { return r.status !== 'PAID'; });
  return sumBy_(rows, 'remainingAmount');
}
