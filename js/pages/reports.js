/**
 * reports.js
 */
var PageReports = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Laporan</h1></div><div class="grid grid-2"><div class="skeleton" style="height:280px"></div><div class="skeleton" style="height:280px"></div></div>';

    var now = new Date();

    root.innerHTML = '\
      <div class="content-header"><h1>Laporan</h1></div>\
      <div class="grid grid-2" style="margin-bottom:16px">\
        <div class="chart-card"><h3 style="margin-bottom:12px">Income vs Expense (6 Bulan)</h3><canvas id="c-ie" height="220"></canvas></div>\
        <div class="chart-card"><h3 style="margin-bottom:12px">Pengeluaran per Kategori (Bulan Ini)</h3><canvas id="c-cat" height="220"></canvas></div>\
      </div>\
      <div class="grid grid-2" style="margin-bottom:16px">\
        <div class="chart-card"><h3 style="margin-bottom:12px">Saldo per Kantong</h3><canvas id="c-bal" height="220"></canvas></div>\
        <div class="chart-card"><h3 style="margin-bottom:12px">Cash Flow (6 Bulan)</h3><canvas id="c-cf" height="220"></canvas></div>\
      </div>\
      <div class="chart-card"><h3 style="margin-bottom:12px">Tren Net Worth (6 Bulan)</h3><canvas id="c-nw" height="220"></canvas></div>';

    try {
      var ie = await Api.reportIncomeExpense(6);
      Charts.barIncomeExpense(root.querySelector('#c-ie'), ie);
    } catch (e) { Toast.error('Gagal memuat chart income/expense: ' + e.message); }

    try {
      var cat = await Api.reportExpenseByCategory(now.getMonth() + 1, now.getFullYear());
      if (cat.length) Charts.pieCategory(root.querySelector('#c-cat'), cat);
    } catch (e) { Toast.error('Gagal memuat chart kategori: ' + e.message); }

    try {
      var bal = await Api.reportBalancePerAccount();
      Charts.barBalance(root.querySelector('#c-bal'), bal);
    } catch (e) { Toast.error('Gagal memuat chart saldo: ' + e.message); }

    try {
      var cf = await Api.reportCashFlow(6);
      Charts.lineSeries(root.querySelector('#c-cf'), cf, 'cashFlow', Charts.palette.brass);
    } catch (e) { Toast.error('Gagal memuat chart cash flow: ' + e.message); }

    try {
      var nw = await Api.reportNetWorthTrend(6);
      Charts.lineSeries(root.querySelector('#c-nw'), nw, 'netWorth', Charts.palette.green);
    } catch (e) { Toast.error('Gagal memuat chart net worth: ' + e.message); }
  }
};
