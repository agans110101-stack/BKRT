/**
 * expenseService.gs
 */

function createExpense(userId, payload) {
  requireFields_(payload, ['date', 'amount', 'categoryId', 'accountId']);
  var amount = validateAmount_(payload.amount);
  validateDate_(payload.date);
  validateAccountActive_(payload.accountId);
  validateCategory_(payload.categoryId, 'EXPENSE');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // Cek saldo di dalam lock supaya tidak race condition dengan transaksi lain.
    validateSufficientBalance_(payload.accountId, amount);

    var expense = {
      expenseId: generateId('EXPENSES'),
      userId: userId,
      date: payload.date,
      amount: amount,
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      description: payload.description || '',
      status: STATUS.ACTIVE,
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    };
    insertRow(SHEET_NAMES.EXPENSES, expense);
    writeLedgerEntry_(userId, payload.date, TX_TYPE.EXPENSE, expense.expenseId, payload.accountId, amount, payload.categoryId, payload.description);
    logAudit_(userId, 'CREATE', 'EXPENSES', expense.expenseId, null, expense);
    return expense;
  } finally {
    lock.releaseLock();
  }
}

function listExpenses(filters) {
  var rows = findRows(SHEET_NAMES.EXPENSES, filters && filters.accountId ? { accountId: filters.accountId } : null);
  rows = rows.filter(function (r) { return r.status !== STATUS.REVERSED || (filters && filters.includeReversed); });
  if (filters && filters.categoryId) {
    rows = rows.filter(function (r) { return r.categoryId === filters.categoryId; });
  }
  if (filters && filters.month && filters.year) {
    rows = rows.filter(function (r) { return isSameMonth_(r.date, filters.month, filters.year); });
  }
  rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  return rows.map(withoutRowMeta_);
}

function reverseExpense(userId, expenseId, reason) {
  return reverseByReference_(SHEET_NAMES.EXPENSES, 'expenseId', expenseId, userId, reason);
}
