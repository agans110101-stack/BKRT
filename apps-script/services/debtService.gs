/**
 * debtService.gs
 * DEBT (utang baru) TIDAK mengubah saldo account secara langsung di ledger
 * utama -- ia menciptakan liability. Jika uang utang benar-benar diterima ke
 * salah satu account, catat itu terpisah lewat createIncome() dengan
 * kategori/sumber yang menjelaskan itu dana utang (mengikuti prinsip #30
 * di spec: DEBT hanya "menciptakan kewajiban").
 */

function createDebt(userId, payload) {
  requireFields_(payload, ['personName', 'totalAmount', 'date']);
  var amount = validateAmount_(payload.totalAmount);
  validateDate_(payload.date);

  var debt = {
    debtId: generateId('DEBTS'),
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
  insertRow(SHEET_NAMES.DEBTS, debt);
  writeLedgerEntry_(userId, payload.date, TX_TYPE.DEBT, debt.debtId, '', amount, '', 'Utang dari ' + payload.personName);
  logAudit_(userId, 'CREATE', 'DEBTS', debt.debtId, null, debt);
  return debt;
}

function createDebtPayment(userId, payload) {
  requireFields_(payload, ['debtId', 'date', 'amount', 'accountId']);
  var amount = validateAmount_(payload.amount);
  validateDate_(payload.date);
  validateAccountActive_(payload.accountId);

  var debt = findById(SHEET_NAMES.DEBTS, 'debtId', payload.debtId);
  if (!debt) throw new AppError_('DEBT_NOT_FOUND', 'Data utang tidak ditemukan.');
  if (amount > toNumber_(debt.remainingAmount)) {
    throw new AppError_('OVERPAYMENT', 'Jumlah pembayaran melebihi sisa utang (Rp' + debt.remainingAmount + ').');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    validateSufficientBalance_(payload.accountId, amount);

    var payment = {
      paymentId: generateId('DEBT_PAYMENTS'),
      debtId: payload.debtId,
      userId: userId,
      date: payload.date,
      amount: amount,
      accountId: payload.accountId,
      description: payload.description || '',
      status: STATUS.ACTIVE,
      createdAt: nowIso_()
    };
    insertRow(SHEET_NAMES.DEBT_PAYMENTS, payment);
    writeLedgerEntry_(userId, payload.date, TX_TYPE.DEBT_PAYMENT, payment.paymentId, payload.accountId, amount, '', 'Bayar utang ke ' + debt.personName);

    var newRemaining = toNumber_(debt.remainingAmount) - amount;
    var newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';
    updateRow(SHEET_NAMES.DEBTS, 'debtId', payload.debtId, { remainingAmount: newRemaining, status: newStatus, updatedAt: nowIso_() });

    logAudit_(userId, 'CREATE', 'DEBT_PAYMENTS', payment.paymentId, null, payment);
    return payment;
  } finally {
    lock.releaseLock();
  }
}

function listDebts() {
  var rows = getAllRows(SHEET_NAMES.DEBTS);
  markOverdue_(rows, 'dueDate', 'status', ['UNPAID', 'PARTIAL']);
  return rows.map(withoutRowMeta_);
}

function getTotalDebt() {
  var rows = findRows(SHEET_NAMES.DEBTS, null).filter(function (d) { return d.status !== 'PAID'; });
  return sumBy_(rows, 'remainingAmount');
}

function markOverdue_(rows, dueDateField, statusField, activeStatuses) {
  var today = new Date();
  rows.forEach(function (r) {
    if (activeStatuses.indexOf(r[statusField]) !== -1 && r[dueDateField]) {
      if (new Date(r[dueDateField]) < today) r[statusField] = 'OVERDUE';
    }
  });
}
