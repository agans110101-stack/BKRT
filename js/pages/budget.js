/**
 * budget.js
 */
var PageBudget = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Budget Bulanan</h1></div><div class="skeleton" style="height:300px"></div>';
    await Store.ensureCategories();

    var now = new Date();
    var state = { month: now.getMonth() + 1, year: now.getFullYear() };

    root.innerHTML = '\
      <div class="content-header">\
        <h1>Budget Bulanan</h1>\
        <div class="control-group">\
          <select id="bMonth" class="mono"></select>\
          <select id="bYear" class="mono"></select>\
          <button class="btn btn-ghost btn-sm" id="btnAddBudget">+ Budget Baru</button>\
        </div>\
      </div>\
      <div class="card" id="budget-host"></div>';

    var monthSel = root.querySelector('#bMonth');
    var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    monthNames.forEach(function (m, i) {
      var opt = document.createElement('option'); opt.value = i + 1; opt.textContent = m;
      if (i + 1 === state.month) opt.selected = true;
      monthSel.appendChild(opt);
    });
    var yearSel = root.querySelector('#bYear');
    for (var y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
      var opt2 = document.createElement('option'); opt2.value = y; opt2.textContent = y;
      if (y === state.year) opt2.selected = true;
      yearSel.appendChild(opt2);
    }

    async function load() {
      var host = root.querySelector('#budget-host');
      host.innerHTML = '<div class="skeleton" style="height:200px"></div>';
      var budgets;
      try { budgets = await Api.budgets(state.month, state.year); } catch (e) { Toast.error(e.message); return; }

      if (!budgets.length) {
        host.innerHTML = '<div class="empty"><div class="empty-title">Belum ada budget bulan ini</div>Klik "+ Budget Baru" untuk mulai.</div>';
        return;
      }
      host.innerHTML = budgets.map(function (b) {
        var pct = Math.min(b.percentage, 100);
        return '\
          <div class="progress-row">\
            <div class="progress-name">' + Icons.category(b.categoryName, 14) + ' ' + b.categoryName + '</div>\
            <div class="progress-track"><div class="progress-fill ' + b.status.toLowerCase() + '" style="width:' + pct + '%"></div></div>\
            <div class="progress-figures">' + formatRupiah(b.used) + ' / ' + formatRupiah(b.budgetAmount) + '</div>\
            <span class="stamp stamp-animate stamp-' + b.status.toLowerCase() + '">' + b.status.replace('_', ' ') + '</span>\
            <button class="btn btn-ghost btn-sm" data-edit-budget="' + b.budgetId + '" data-amount="' + b.budgetAmount + '" data-cat="' + b.categoryName + '">' + Icons.misc('edit', 13) + ' Update</button>\
          </div>';
      }).join('');

      host.querySelectorAll('[data-edit-budget]').forEach(function (btn) {
        btn.onclick = function () {
          openUpdateBudgetForm_(btn.dataset.editBudget, btn.dataset.cat, btn.dataset.amount, load);
        };
      });
    }

    monthSel.onchange = function () { state.month = Number(monthSel.value); load(); };
    yearSel.onchange = function () { state.year = Number(yearSel.value); load(); };

    root.querySelector('#btnAddBudget').onclick = function () { openBudgetForm_(state, load); };

    load();
  }
};

function openBudgetForm_(state, onSaved) {
  var form = document.createElement('form');
  var catOptions = Store.categoriesByType('EXPENSE').map(function (c) { return '<option value="' + c.categoryId + '">' + c.name + '</option>'; }).join('');
  form.innerHTML = '\
    <div class="field"><label>Kategori</label><select name="categoryId" required>' + catOptions + '</select></div>\
    <div class="field"><label>Jumlah Budget (Rp)</label><input type="number" name="budgetAmount" min="1" required></div>\
    <input type="hidden" name="month" value="' + state.month + '">\
    <input type="hidden" name="year" value="' + state.year + '">\
    <button class="btn btn-primary btn-block" type="submit">Simpan Budget</button>';

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form); var data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    try {
      await Api.createBudget(data);
      Modal.close();
      Toast.success('Budget tersimpan.');
      onSaved();
    } catch (err) { Toast.error(err.message); }
  });

  Modal.open('Tambah Budget', form);
}

function openUpdateBudgetForm_(budgetId, categoryName, currentAmount, onSaved) {
  var form = document.createElement('form');
  form.innerHTML = '\
    <p style="color:var(--ink-text-dim);font-size:12.5px;margin-top:0">Kategori: <strong style="color:var(--ink-text)">' + categoryName + '</strong></p>\
    <div class="field"><label>Jumlah Budget Baru (Rp)</label><input type="number" name="budgetAmount" min="1" value="' + currentAmount + '" required></div>\
    <button class="btn btn-primary btn-block" type="submit">Update Budget</button>';

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await Api.updateBudget(budgetId, { budgetAmount: form.budgetAmount.value });
      Modal.close();
      Toast.success('Budget diupdate.');
      onSaved();
    } catch (err) { Toast.error(err.message); }
  });

  Modal.open('Update Budget', form);
}
