/**
 * income.js
 * (Bersih dari kolom Infaq -- infaq sekarang di halaman terpisah "Infaq")
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
      <div class="control-group" style="margin-bottom:16px">\
        <div class="field search-field" style="margin-bottom:0"><label>Cari</label><div class="search-box">' + Icons.misc('search', 14) + '<input type="text" id="filter-search" placeholder="Cari sumber, kategori, catatan..."><button type="button" class="search-clear" id="btnClearSearch">&times;</button></div></div>\
        <div class="field" style="margin-bottom:0"><label>' + Icons.misc('filter', 12) + ' Bulan</label><input type="month" id="filter-month"></div>\
        <div class="field" style="margin-bottom:0"><label>Kategori</label><select id="filter-cat"><option value="">Semua Kategori</option>' + incomeCats.map(function (c) { return '<option value="' + c.categoryId + '">' + c.name + '</option>'; }).join('') + '</select></div>\
        <div class="field" style="margin-bottom:0"><label>Kantong</label><select id="filter-acc"><option value="">Semua Kantong</option>' + Store.accounts.map(function (a) { return '<option value="' + a.accountId + '">' + a.name + '</option>'; }).join('') + '</select></div>\
        <button class="btn btn-ghost btn-sm" id="btnResetFilter" style="align-self:flex-end">Reset</button>\
      </div>\
      <div class="card"><div class="table-wrap"><table class="ledger">\
        <thead><tr><th>Tanggal</th><th>Sumber</th><th>Kategori</th><th>Kantong</th><th>Catatan</th><th class="num">Jumlah</th><th></th></tr></thead>\
        <tbody id="income-body"></tbody>\
        <tfoot><tr><td colspan="5" style="text-align:right;font-weight:600">Total (sesuai filter)</td><td class="num money money-pos" id="income-total" style="font-weight:600"></td><td></td></tr></tfoot>\
      </table></div></div>';

    var tbody = root.querySelector('#income-body');
    var totalEl = root.querySelector('#income-total');
    var searchEl = root.querySelector('#filter-search');
    var searchClearBtn = root.querySelector('#btnClearSearch');
    var monthEl = root.querySelector('#filter-month');
    var catEl = root.querySelector('#filter-cat');
    var accEl = root.querySelector('#filter-acc');

    function applyFilters_() {
      var rows = allRows;
      if (monthEl.value) rows = rows.filter(function (r) { return (r.date || '').slice(0, 7) === monthEl.value; });
      if (catEl.value) rows = rows.filter(function (r) { return r.categoryId === catEl.value; });
      if (accEl.value) rows = rows.filter(function (r) { return r.accountId === accEl.value; });
      var q = (searchEl.value || '').trim().toLowerCase();
      searchEl.parentElement.classList.toggle('has-value', !!q);
      if (q) {
        rows = rows.filter(function (r) {
          var haystack = [r.source, Store.categoryName(r.categoryId), Store.accountName(r.accountId), r.description].join(' ').toLowerCase();
          return haystack.indexOf(q) !== -1;
        });
      }
      draw(rows);
    }

    function draw(rows) {
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><div class="empty-title">Tidak ada data</div>Coba ubah filter, atau tekan tombol + untuk menambah.</div></td></tr>';
        totalEl.textContent = formatRupiah(0);
        return;
      }
      tbody.innerHTML = rows.map(function (r) {
        var reversed = r.status === 'REVERSED';
        return '<tr' + (reversed ? ' style="opacity:.45;text-decoration:line-through"' : '') + '>\
          <td>' + formatDateShort(r.date) + '</td>\
          <td>' + (r.source || '-') + '</td>\
          <td>' + Icons.category(Store.categoryName(r.categoryId), 14) + ' ' + Store.categoryName(r.categoryId) + '</td>\
          <td>' + Store.accountName(r.accountId) + '</td>\
          <td>' + (r.description || '-') + '</td>\
          <td class="num money money-pos">+' + formatRupiah(r.amount) + '</td>\
          <td>' + (reversed ? '' : '<button class="btn btn-ghost btn-sm" data-reverse-income="' + r.incomeId + '" style="text-decoration:none">Batalkan</button>') + '</td>\
        </tr>';
      }).join('');

      var total = rows.filter(function (r) { return r.status !== 'REVERSED'; }).reduce(function (s, r) { return s + Number(r.amount); }, 0);
      totalEl.textContent = formatRupiah(total);

      tbody.querySelectorAll('[data-reverse-income]').forEach(function (btn) {
        btn.onclick = function () { confirmReverse_('income', btn.dataset.reverseIncome, function () { PageIncome.render(root); }); };
      });
    }

    draw(allRows);
    monthEl.onchange = applyFilters_;
    catEl.onchange = applyFilters_;
    accEl.onchange = applyFilters_;
    searchEl.oninput = applyFilters_;
    searchClearBtn.onclick = function () { searchEl.value = ''; searchEl.focus(); applyFilters_(); };
    root.querySelector('#btnResetFilter').onclick = function () {
      monthEl.value = ''; catEl.value = ''; accEl.value = ''; searchEl.value = '';
      searchEl.parentElement.classList.remove('has-value');
      draw(allRows);
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
