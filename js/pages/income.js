/**
 * income.js
 */
var PageIncome = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Income</h1></div><div class="skeleton" style="height:300px"></div>';
    await Promise.all([Store.ensureAccounts(), Store.ensureCategories()]);

    var allRows;
    try { allRows = await Api.incomes({}); } catch (e) { Toast.error(e.message); return; }

    var totalThisMonth = allRows.filter(function (r) {
      var d = new Date(r.date), now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.status !== 'REVERSED';
    }).reduce(function (s, r) { return s + Number(r.amount); }, 0);

    var incomeCats = Store.categoriesByType('INCOME');

    root.innerHTML = '\
      <div class="content-header">\
        <h1>Income</h1>\
        <div class="card" style="padding:10px 16px"><div class="card-label" style="margin-bottom:2px">Bulan Ini</div><div class="money money-pos" style="font-size:16px">' + formatRupiah(totalThisMonth) + '</div></div>\
      </div>\
      <div class="field" style="max-width:240px;margin-bottom:16px">\
        <label>Filter Kategori</label>\
        <select id="filter-cat"><option value="">Semua Kategori</option>' + incomeCats.map(function (c) { return '<option value="' + c.categoryId + '">' + c.name + '</option>'; }).join('') + '</select>\
      </div>\
      <div class="card"><div class="table-wrap"><table class="ledger">\
        <thead><tr><th>Tanggal</th><th>Sumber</th><th>Kategori</th><th>Kantong</th><th>Catatan</th><th class="num">Jumlah</th><th></th></tr></thead>\
        <tbody id="income-body"></tbody>\
      </table></div></div>';

    var tbody = root.querySelector('#income-body');

    function draw(rows) {
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><div class="empty-title">Tidak ada data</div>Coba ubah filter, atau tekan tombol + untuk menambah.</div></td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (r) {
        var reversed = r.status === 'REVERSED';
        return '<tr' + (reversed ? ' style="opacity:.45;text-decoration:line-through"' : '') + '>\
          <td>' + formatDateShort(r.date) + '</td>\
          <td>' + (r.source || '-') + '</td>\
          <td>' + Store.categoryName(r.categoryId) + '</td>\
          <td>' + Store.accountName(r.accountId) + '</td>\
          <td>' + (r.description || '-') + '</td>\
          <td class="num money money-pos">+' + formatRupiah(r.amount) + '</td>\
          <td>' + (reversed ? '' : '<button class="btn btn-ghost btn-sm" data-reverse-income="' + r.incomeId + '" style="text-decoration:none">Batalkan</button>') + '</td>\
        </tr>';
      }).join('');

      tbody.querySelectorAll('[data-reverse-income]').forEach(function (btn) {
        btn.onclick = function () { confirmReverse_('income', btn.dataset.reverseIncome, function () { PageIncome.render(root); }); };
      });
    }

    draw(allRows);

    root.querySelector('#filter-cat').onchange = function (e) {
      var val = e.target.value;
      draw(val ? allRows.filter(function (r) { return r.categoryId === val; }) : allRows);
    };
  }
};

/** Dipakai bersama oleh Income/Expense/Transfer untuk aksi "Batalkan". */
function confirmReverse_(type, id, onDone) {
  var reason = window.prompt('Batalkan transaksi ini? Tulis alasan singkat (opsional):', '');
  if (reason === null) return; // user cancel

  var call = type === 'income' ? Api.reverseIncome(id, reason)
    : type === 'expense' ? Api.reverseExpense(id, reason)
    : Api.reverseTransfer(id, reason);

  call.then(function () {
    Toast.success('Transaksi dibatalkan.');
    onDone();
  }).catch(function (e) { Toast.error(e.message); });
}
