/**
 * dashboardService.gs
 */

function getDashboard() {
  var today = new Date();
  var month = today.getMonth() + 1;
  var year = today.getFullYear();

  var accounts = listAccounts();
  var totalBalance = accounts.reduce(function (acc, a) { return acc + a.balance; }, 0);

  var incomeThisMonth = findRows(SHEET_NAMES.INCOME, { status: STATUS.ACTIVE })
    .filter(function (r) { return isSameMonth_(r.date, month, year); });
  var expenseThisMonth = findRows(SHEET_NAMES.EXPENSES, { status: STATUS.ACTIVE })
    .filter(function (r) { return isSameMonth_(r.date, month, year); });

  var totalIncome = sumBy_(incomeThisMonth, 'amount');
  var totalExpense = sumBy_(expenseThisMonth, 'amount');
  var cashFlow = totalIncome - totalExpense;

  var totalInvestment = getTotalInvestmentValue();
  var totalDebt = getTotalDebt();
  var totalReceivable = getTotalReceivable();

  // Net worth = (Cash+Bank+Savings+Investment+Receivable) - Debt
  var netWorth = totalBalance + totalInvestment + totalReceivable - totalDebt;

  return {
    month: month,
    year: year,
    totalBalance: totalBalance,
    incomeThisMonth: totalIncome,
    expenseThisMonth: totalExpense,
    cashFlow: cashFlow,
    totalInvestment: totalInvestment,
    totalDebt: totalDebt,
    totalReceivable: totalReceivable,
    netWorth: netWorth,
    accounts: accounts,
    budgets: listBudgets(month, year)
  };
}
