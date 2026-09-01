/**
 * dashboard.js
 */
var PageDashboard = {
  async render(root) {
    root.innerHTML = '<div class="skeleton" style="height:140px;margin-bottom:20px"></div><div class="grid grid-4"><div class="skeleton" style="height:90px"></div><div class="skeleton" style="height:90px"></div><div class="skeleton" style="height:90px"></div><div class="skeleton" style="height:90px"></div></div>';

    var data;
    try { data = await Api.dashboard(); } catch (e) { Toast.error(e.message); return; }
    await Store.ensureAccounts();

    var netWorthPositive = data.netWorth >= 0;

    root.innerHTML = '\
      <div class="hero">\
        <div class="hero-label">Kekayaan Bersih (Net Worth)</div>\
        <div class="hero-value ' + (netWorthPositive ? 'money-pos' : 'money-neg') + '">' + formatRupiah(data.netWorth) + '</div>\
        <div class="hero-meta">\
          <div class="hero-meta-item">Total Saldo Kantong<span class="money">' + formatRupiah(data.totalBalance) + '</span></div>\
          <div class="hero-meta-item">Investasi<span class="money">' + formatRupiah(data.totalInvestment) + '</span></div>\
          <div class="hero-meta-item">Piutang<span class="money">' + formatRupiah(data.totalReceivable) + '</span></div>\
          <div class="hero-meta-item">Utang<span class="money money-neg">' + formatRupiah(data.totalDebt) + '</span></div>\
        </div>\
      </div>\
      <div class="grid grid-4" style="margin-bottom:24px">\
        ' + statCard_('Income bulan ini', data.incomeThisMonth, 'teal', 'income') + '\
        ' + statCard_('Expense bulan ini', data.expenseThisMonth, 'orange', 'expense') + '\
        ' + statCard_('Cash flow', data.cashFlow, 'sky', data.cashFlow >= 0 ? 'income' : 'expense') + '\
        ' + statCard_('Total investasi', data.totalInvestment, 'amber', 'investment') + '\
      </div>\
      <h2 style="margin-bottom:12px">Kantong</h2>\
      <div class="pouch-row" id="pouch-row" style="margin-bottom:28px"></div>\
      <div class="grid grid-2">\
        <div>\
          <h2 style="margin-bottom:12px">Budget Bulan Ini</h2>\
          <div class="card" id="budget-list"></div>\
        </div>\
        <div>\
          <h2 style="margin-bottom:12px">Income vs Expense</h2>\
          <div class="chart-card"><canvas id="chart-ie" height="220"></canvas></div>\
        </div>\
      </div>';

    var pouchRow = root.querySelector('#pouch-row');
    data.accounts.forEach(function (acc) {
      var a = document.createElement('a');
      a.href = '#/accounts/' + acc.accountId;
      a.className = 'pouch';
      a.innerHTML = '<div class="pouch-name">' + acc.name + '</div><div class="pouch-balance money">' + formatRupiah(acc.balance) + '</div>';
      pouchRow.appendChild(a);
    });

    renderBudgetList_(root.querySelector('#budget-list'), data.budgets);

    try {
      var trend = await Api.reportIncomeExpense(6);
      Charts.barIncomeExpense(root.querySelector('#chart-ie'), trend);
    } catch (e) { /* diamkan, chart opsional */ }
  }
};

function statCard_(label, value, color, iconKey) {
  color = color || 'teal';
  return '<div class="card stat-card stat-' + color + '">\
    <div class="stat-icon">' + Icons.nav(iconKey || 'wallet', 17) + '</div>\
    <div class="card-label">' + label + '</div>\
    <div class="card-value money">' + formatRupiah(value) + '</div>\
  </div>';
}

function renderBudgetList_(host, budgets) {
  if (!budgets.length) {
    host.innerHTML = '<div class="empty"><div class="empty-title">Belum ada budget bulan ini</div>Tambahkan budget lewat menu Budget Bulanan.</div>';
    return;
  }
  host.innerHTML = budgets.map(function (b) {
    var pct = Math.min(b.percentage, 100);
    return '\
      <div class="progress-row">\
        <div class="progress-name">' + b.categoryName + '</div>\
        <div class="progress-track"><div class="progress-fill ' + b.status.toLowerCase() + '" style="width:' + pct + '%"></div></div>\
        <div class="progress-figures">' + formatRupiah(b.used) + ' / ' + formatRupiah(b.budgetAmount) + '</div>\
      </div>';
  }).join('');
}
