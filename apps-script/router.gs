/**
 * router.gs
 * Entry point HTTP. Frontend memanggil Web App URL dengan:
 *  - GET  ?action=xxx&token=xxx&...params
 *  - POST body (text/plain berisi JSON string, LIHAT CATATAN CORS di README)
 *    { action: 'xxx', token: 'xxx', ...payload }
 *
 * PENTING soal CORS: Apps Script Web App tidak bisa menangani preflight
 * OPTIONS request custom. Supaya browser tidak mengirim preflight saat POST,
 * frontend HARUS mengirim body dengan Content-Type "text/plain" (bukan
 * application/json) walau isinya string JSON. Lihat frontend/js/api.js.
 */

var PUBLIC_ACTIONS = ['login']; // action yang tidak butuh token

function doGet(e) {
  return routeRequest(e, 'GET');
}

function doPost(e) {
  return routeRequest(e, 'POST');
}

function routeRequest(e, method) {
  try {
    var params = parseParams_(e, method);
    var action = params.action;
    if (!action) throw new AppError_('MISSING_ACTION', 'Parameter action wajib diisi.');

    var userId = null;
    if (PUBLIC_ACTIONS.indexOf(action) === -1) {
      userId = requireAuth_(params.token);
    }

    var result = dispatch_(action, userId, params);
    return successResponse_(result);
  } catch (err) {
    return errorResponse_(err.message || 'Terjadi kesalahan.', err.code || 'ERROR');
  }
}

function parseParams_(e, method) {
  var params = {};
  if (e && e.parameter) {
    for (var key in e.parameter) params[key] = e.parameter[key];
  }
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      for (var k in body) params[k] = body[k];
    } catch (err) {
      throw new AppError_('INVALID_BODY', 'Body request bukan JSON yang valid.');
    }
  }
  return params;
}

function dispatch_(action, userId, p) {
  switch (action) {
    // --- AUTH ---
    case 'login': return login(p.username, p.password);
    case 'logout': return logout(p.token);

    // --- DASHBOARD & REPORTS ---
    case 'dashboard': return getDashboard();
    case 'reportIncomeExpense': return reportIncomeExpensePerMonth(Number(p.monthsBack) || 6);
    case 'reportExpenseByCategory': return reportExpenseByCategory(Number(p.month), Number(p.year));
    case 'reportBalancePerAccount': return reportBalancePerAccount();
    case 'reportCashFlow': return reportCashFlow(Number(p.monthsBack) || 6);
    case 'reportNetWorthTrend': return reportNetWorthTrend(Number(p.monthsBack) || 6);

    // --- ACCOUNTS ---
    case 'accounts': return listAccounts();
    case 'accountDetail': return getAccountDetail(p.accountId);
    case 'createAccount': return createAccount(p);

    // --- CATEGORIES ---
    case 'categories': return findRows(SHEET_NAMES.CATEGORIES, { isActive: true }).map(withoutRowMeta_);
    case 'createCategory': return createCategory_(userId, p);

    // --- TRANSACTIONS (ledger, read-only gabungan) ---
    case 'transactions': return listTransactions(p);

    // --- INCOME ---
    case 'incomes': return listIncome(p);
    case 'createIncome': return createIncome(userId, p);
    case 'reverseIncome': return reverseIncome(userId, p.incomeId, p.reason);
    case 'markInfaqDone': return markIncomeInfaqStatus(userId, p.incomeId, 'DONE');
    case 'markInfaqNotYet': return markIncomeInfaqStatus(userId, p.incomeId, 'NOT_YET');
    case 'infaqSummary': return getInfaqSummary();

    // --- EXPENSES ---
    case 'expenses': return listExpenses(p);
    case 'createExpense': return createExpense(userId, p);
    case 'reverseExpense': return reverseExpense(userId, p.expenseId, p.reason);

    // --- TRANSFERS ---
    case 'transfers': return listTransfers(p);
    case 'createTransfer': return createTransfer(userId, p);
    case 'reverseTransfer': return reverseTransfer(userId, p.transferId, p.reason);

    // --- BUDGETS ---
    case 'budgets': return listBudgets(p.month, p.year);
    case 'createBudget': return createBudget(userId, p);
    case 'updateBudget': return updateBudget(userId, p.budgetId, p);

    // --- INVESTMENTS ---
    case 'investments': return listInvestments(p.type);
    case 'createInvestment': return createInvestment(userId, p);
    case 'updateGoldPrice': return updateGoldPrice(userId, p.pricePerGram);

    // --- DEBTS ---
    case 'debts': return listDebts();
    case 'createDebt': return createDebt(userId, p);
    case 'createDebtPayment': return createDebtPayment(userId, p);

    // --- RECEIVABLES ---
    case 'receivables': return listReceivables();
    case 'createReceivable': return createReceivable(userId, p);
    case 'createReceivablePayment': return createReceivablePayment(userId, p);

    default:
      throw new AppError_('UNKNOWN_ACTION', 'Action "' + action + '" tidak dikenali.');
  }
}

function createCategory_(userId, payload) {
  requireFields_(payload, ['name', 'type']);
  var category = {
    categoryId: generateId('CATEGORIES'),
    userId: userId,
    name: payload.name,
    type: payload.type,
    icon: payload.icon || '',
    color: payload.color || '',
    isActive: true,
    createdAt: nowIso_(),
    updatedAt: nowIso_()
  };
  insertRow(SHEET_NAMES.CATEGORIES, category);
  return category;
}
