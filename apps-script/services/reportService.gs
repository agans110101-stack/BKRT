/**
 * reportService.gs
 * Mengembalikan data siap-pakai untuk Chart.js di frontend (bukan raw rows).
 */

function reportIncomeExpensePerMonth(monthsBack) {
  monthsBack = monthsBack || 6;
  var income = findRows(SHEET_NAMES.INCOME, { status: STATUS.ACTIVE });
  var expense = findRows(SHEET_NAMES.EXPENSES, { status: STATUS.ACTIVE });

  var buckets = buildMonthBuckets_(monthsBack);
  buckets.forEach(function (b) {
    b.income = sumBy_(income.filter(function (r) { return isSameMonth_(r.date, b.month, b.year); }), 'amount');
    b.expense = sumBy_(expense.filter(function (r) { return isSameMonth_(r.date, b.month, b.year); }), 'amount');
  });
  return buckets;
}

function reportExpenseByCategory(month, year) {
  var expenses = findRows(SHEET_NAMES.EXPENSES, { status: STATUS.ACTIVE })
    .filter(function (r) { return isSameMonth_(r.date, month, year); });
  var categories = getAllRows(SHEET_NAMES.CATEGORIES);
  var catMap = {};
  categories.forEach(function (c) { catMap[c.categoryId] = c.name; });

  var totals = {};
  expenses.forEach(function (e) {
    var name = catMap[e.categoryId] || 'Lainnya';
    totals[name] = (totals[name] || 0) + toNumber_(e.amount);
  });

  return Object.keys(totals).map(function (name) { return { category: name, total: totals[name] }; })
    .sort(function (a, b) { return b.total - a.total; });
}

function reportBalancePerAccount() {
  return listAccounts().map(function (a) { return { account: a.name, balance: a.balance }; });
}

function reportCashFlow(monthsBack) {
  return reportIncomeExpensePerMonth(monthsBack).map(function (b) {
    return { label: b.label, cashFlow: b.income - b.expense };
  });
}

function reportNetWorthTrend(monthsBack) {
  // Pendekatan praktis: hitung net worth berjalan di akhir tiap bulan
  // berdasarkan ledger transaksi sampai tanggal tsb (snapshot historis).
  monthsBack = monthsBack || 6;
  var buckets = buildMonthBuckets_(monthsBack);
  var accounts = getAllRows(SHEET_NAMES.ACCOUNTS);
  var allTx = getAllRows(SHEET_NAMES.TRANSACTIONS);
  var allInvestments = getAllRows(SHEET_NAMES.INVESTMENTS);
  var allDebts = getAllRows(SHEET_NAMES.DEBTS);
  var allReceivables = getAllRows(SHEET_NAMES.RECEIVABLES);

  return buckets.map(function (b) {
    var cutoff = new Date(b.year, b.month, 0, 23, 59, 59); // akhir bulan tsb

    var balanceAtCutoff = accounts.reduce(function (sum, acc) {
      var bal = toNumber_(acc.initialBalance);
      allTx.filter(function (t) { return t.accountId === acc.accountId && new Date(t.date) <= cutoff; })
        .forEach(function (t) {
          var amt = toNumber_(t.amount);
          if ([TX_TYPE.INCOME, TX_TYPE.TRANSFER_IN, TX_TYPE.RECEIVABLE_PAYMENT].indexOf(t.type) !== -1) bal += amt;
          else if ([TX_TYPE.EXPENSE, TX_TYPE.TRANSFER_OUT, TX_TYPE.INVESTMENT, TX_TYPE.DEBT_PAYMENT, TX_TYPE.RECEIVABLE].indexOf(t.type) !== -1) bal -= amt;
        });
      return sum + bal;
    }, 0);

    var investmentAtCutoff = sumBy_(allInvestments.filter(function (i) { return new Date(i.date) <= cutoff; }), 'currentValue');
    var debtAtCutoff = sumBy_(allDebts.filter(function (d) { return new Date(d.date) <= cutoff; }), 'remainingAmount');
    var receivableAtCutoff = sumBy_(allReceivables.filter(function (r) { return new Date(r.date) <= cutoff; }), 'remainingAmount');

    return {
      label: b.label,
      netWorth: balanceAtCutoff + investmentAtCutoff + receivableAtCutoff - debtAtCutoff
    };
  });
}

function buildMonthBuckets_(monthsBack) {
  var result = [];
  var now = new Date();
  for (var i = monthsBack - 1; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Jakarta', 'MMM yyyy')
    });
  }
  return result;
}
