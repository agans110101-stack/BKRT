/**
 * budgetService.gs
 * "used" TIDAK PERNAH disimpan manual. Selalu dihitung dari EXPENSES
 * (status ACTIVE) yang cocok categoryId + bulan + tahun budget tsb.
 */

var BUDGET_STATUS = {
  SAFE: 'SAFE',           // < 70%
  WARNING: 'WARNING',     // 70% - 89%
  NEAR_LIMIT: 'NEAR_LIMIT', // 90% - 99%
  OVER_BUDGET: 'OVER_BUDGET' // >= 100%
};

function createBudget(userId, payload) {
  requireFields_(payload, ['month', 'year', 'categoryId', 'budgetAmount']);
  validateCategory_(payload.categoryId, 'EXPENSE');
  var amount = validateAmount_(payload.budgetAmount);

  var dup = findRows(SHEET_NAMES.BUDGETS, { categoryId: payload.categoryId, month: payload.month, year: payload.year });
  if (dup.length > 0) {
    throw new AppError_('BUDGET_EXISTS', 'Budget untuk kategori ini di bulan tersebut sudah ada. Gunakan update.');
  }

  var budget = {
    budgetId: generateId('BUDGETS'),
    userId: userId,
    month: Number(payload.month),
    year: Number(payload.year),
    categoryId: payload.categoryId,
    budgetAmount: amount,
    createdAt: nowIso_(),
    updatedAt: nowIso_()
  };
  insertRow(SHEET_NAMES.BUDGETS, budget);
  logAudit_(userId, 'CREATE', 'BUDGETS', budget.budgetId, null, budget);
  return enrichBudget_(budget);
}

function updateBudget(userId, budgetId, payload) {
  var patch = { updatedAt: nowIso_() };
  if (payload.budgetAmount !== undefined) patch.budgetAmount = validateAmount_(payload.budgetAmount);
  var updated = updateRow(SHEET_NAMES.BUDGETS, 'budgetId', budgetId, patch);
  logAudit_(userId, 'UPDATE', 'BUDGETS', budgetId, null, patch);
  return enrichBudget_(updated);
}

function listBudgets(month, year) {
  var filters = {};
  if (month) filters.month = Number(month);
  if (year) filters.year = Number(year);
  var rows = findRows(SHEET_NAMES.BUDGETS, filters);
  return rows.map(enrichBudget_);
}

function enrichBudget_(budget) {
  var expenses = findRows(SHEET_NAMES.EXPENSES, { categoryId: budget.categoryId, status: STATUS.ACTIVE })
    .filter(function (e) { return isSameMonth_(e.date, budget.month, budget.year); });

  var used = sumBy_(expenses, 'amount');
  var budgetAmount = toNumber_(budget.budgetAmount);
  var remaining = budgetAmount - used;
  var percentage = budgetAmount > 0 ? Math.round((used / budgetAmount) * 100) : 0;

  var status = BUDGET_STATUS.SAFE;
  if (percentage >= 100) status = BUDGET_STATUS.OVER_BUDGET;
  else if (percentage >= 90) status = BUDGET_STATUS.NEAR_LIMIT;
  else if (percentage >= 70) status = BUDGET_STATUS.WARNING;

  var category = findById(SHEET_NAMES.CATEGORIES, 'categoryId', budget.categoryId);

  return withoutRowMeta_(Object.assign({}, budget, {
    categoryName: category ? category.name : budget.categoryId,
    used: used,
    remaining: remaining,
    percentage: percentage,
    status: status
  }));
}
