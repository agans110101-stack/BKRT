/**
 * quickAdd.js
 * Tombol "+ Tambah Transaksi" mengambang. Form berubah sesuai tab yang
 * dipilih: Income, Expense, Transfer, Investment, Debt, Receivable.
 *
 * Khusus Income & Expense: mendukung MULTI-BARIS dalam satu popup (satu
 * tanggal yang sama, banyak baris transaksi) -- supaya input catatan harian
 * yang panjang tidak perlu buka-tutup popup berkali-kali.
 */
var QuickAdd = (function () {
  var TYPES = [
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'investment', label: 'Investasi' },
    { key: 'debt', label: 'Utang' },
    { key: 'receivable', label: 'Piutang' }
  ];

  async function open(defaultType) {
    await Promise.all([Store.ensureAccounts(), Store.ensureCategories()]);

    var wrap = document.createElement('div');
    var tabs = document.createElement('div');
    tabs.className = 'tabs';
    var formHost = document.createElement('div');

    var current = defaultType || 'expense';

    TYPES.forEach(function (t) {
      var tab = document.createElement('div');
      tab.className = 'tab' + (t.key === current ? ' active' : '');
      tab.textContent = t.label;
      tab.onclick = function () {
        current = t.key;
        Array.from(tabs.children).forEach(function (c) { c.classList.remove('active'); });
        tab.classList.add('active');
        renderForm_(formHost, current);
      };
      tabs.appendChild(tab);
    });

    wrap.appendChild(tabs);
    wrap.appendChild(formHost);
    renderForm_(formHost, current);

    Modal.open('Tambah Transaksi', wrap);
  }

  function accountOptions_() {
    return Store.accounts.map(function (a) { return '<option value="' + a.accountId + '">' + a.name + ' (' + formatRupiah(a.balance) + ')</option>'; }).join('');
  }
  function categoryOptions_(type) {
    return Store.categoriesByType(type).map(function (c) { return '<option value="' + c.categoryId + '">' + c.name + '</option>'; }).join('');
  }

  function renderForm_(host, type) {
    host.innerHTML = '';

    if (type === 'income' || type === 'expense') {
      host.appendChild(buildMultiForm_(type));
      return;
    }

    var form = document.createElement('form');
    var builders = { transfer: transferForm_, investment: investmentForm_, debt: debtForm_, receivable: receivableForm_ };
    form.innerHTML = builders[type]();
    var submitHandlers = { transfer: submitTransfer_, investment: submitInvestment_, debt: submitDebt_, receivable: submitReceivable_ };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitHandlers[type](form);
    });

    if (type === 'investment') {
      var typeSelect = form.querySelector('[name=invType]');
      var goldFields = form.querySelector('.gold-fields');
      typeSelect.addEventListener('change', function () {
        goldFields.style.display = typeSelect.value === 'GOLD' ? 'block' : 'none';
      });
    }

    host.appendChild(form);
  }

  /* ============================= MULTI-BARIS: Income & Expense ============================= */

  function buildMultiForm_(kind) {
    var catType = kind === 'income' ? 'INCOME' : 'EXPENSE';
    var rowCount = 0;

    var form = document.createElement('form');
    form.innerHTML = '\
      <div class="field"><label>Tanggal (berlaku untuk semua baris di bawah)</label><input type="date" class="shared-date" value="' + todayIso() + '" required></div>\
      <div id="rows-host"></div>\
      <button type="button" class="btn btn-ghost btn-sm btn-block" id="btnAddRow" style="margin-bottom:14px">+ Tambah Baris</button>\
      <button class="btn btn-primary btn-block" type="submit" id="btnSubmitMulti">Simpan</button>';

    var rowsHost = form.querySelector('#rows-host');

    function rowTemplate_(n) {
      var row = document.createElement('div');
      row.className = 'quickadd-row';
      row.style.cssText = 'border-top:1px solid var(--ink-line);padding-top:12px;margin-top:4px';
      var extraField = kind === 'income'
        ? '<div class="field"><label>Sumber (opsional)</label><input type="text" class="f-source" placeholder="mis. Kantor"></div>'
        : '';
      row.innerHTML = '\
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">\
          <span style="font-size:11px;color:var(--ink-text-dim);text-transform:uppercase;letter-spacing:.06em">Baris ' + n + '</span>\
          <button type="button" class="row-remove" style="background:none;border:none;color:var(--ledger-red);cursor:pointer;font-size:12px">Hapus</button>\
        </div>\
        <div class="field-row">\
          <div class="field"><label>Jumlah (Rp)</label><input type="number" class="f-amount" min="1" step="1" required placeholder="0"></div>\
          <div class="field"><label>Kategori</label><select class="f-category" required>' + categoryOptions_(catType) + '</select></div>\
        </div>\
        <div class="field-row">\
          <div class="field"><label>Kantong</label><select class="f-account" required>' + accountOptions_() + '</select></div>\
          <div class="field"><label>Catatan</label><input type="text" class="f-desc"></div>\
        </div>' + extraField;
      return row;
    }

    function refreshRowChrome_() {
      var rows = Array.from(rowsHost.querySelectorAll('.quickadd-row'));
      rows.forEach(function (r, idx) {
        r.querySelector('span').textContent = 'Baris ' + (idx + 1);
        var removeBtn = r.querySelector('.row-remove');
        removeBtn.style.display = rows.length > 1 ? 'inline' : 'none';
        removeBtn.onclick = function () { r.remove(); refreshRowChrome_(); };
      });
      var submitBtn = form.querySelector('#btnSubmitMulti');
      submitBtn.textContent = rows.length > 1 ? 'Simpan ' + rows.length + ' Transaksi' : 'Simpan';
    }

    function addRow() {
      rowCount++;
      var row = rowTemplate_(rowCount);
      rowsHost.appendChild(row);
      refreshRowChrome_();
      var firstInput = row.querySelector('.f-amount');
      if (firstInput) firstInput.focus();
    }

    addRow(); // baris pertama otomatis ada
    form.querySelector('#btnAddRow').onclick = addRow;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitMulti_(kind, form);
    });

    return form;
  }

  async function submitMulti_(kind, form) {
    var date = form.querySelector('.shared-date').value;
    var rows = Array.from(form.querySelectorAll('.quickadd-row'));
    var payloads = rows.map(function (r) {
      var p = {
        date: date,
        amount: r.querySelector('.f-amount').value,
        categoryId: r.querySelector('.f-category').value,
        accountId: r.querySelector('.f-account').value,
        description: r.querySelector('.f-desc').value
      };
      if (kind === 'income') {
        var srcEl = r.querySelector('.f-source');
        p.source = srcEl ? srcEl.value : '';
      }
      return p;
    });

    var submitBtn = form.querySelector('#btnSubmitMulti');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    var successCount = 0;
    var firstError = null;

    for (var i = 0; i < payloads.length; i++) {
      try {
        if (kind === 'income') await Api.createIncome(payloads[i]);
        else await Api.createExpense(payloads[i]);
        successCount++;
      } catch (err) {
        firstError = 'Baris ' + (i + 1) + ': ' + err.message;
        break; // hentikan di baris pertama yang gagal supaya tidak makin membingungkan
      }
    }

    submitBtn.disabled = false;

    if (successCount === payloads.length) {
      Modal.close();
      Toast.success(successCount > 1 ? successCount + ' transaksi tersimpan.' : 'Transaksi tersimpan.');
      Router.refresh();
    } else {
      Toast.error((successCount > 0 ? successCount + ' baris berhasil tersimpan, tapi berhenti di: ' : '') + firstError);
      submitBtn.textContent = rows.length > 1 ? 'Simpan ' + rows.length + ' Transaksi' : 'Simpan';
      if (successCount > 0) Router.refresh(); // sebagian sudah masuk, refresh data di belakang layar
    }
  }

  /* ============================= Single-baris: Transfer/Investasi/Utang/Piutang ============================= */

  function transferForm_() {
    return '\
      <div class="field"><label>Tanggal</label><input type="date" name="date" value="' + todayIso() + '" required></div>\
      <div class="field"><label>Jumlah (Rp)</label><input type="number" name="amount" min="1" step="1" required placeholder="0"></div>\
      <div class="field-row">\
        <div class="field"><label>Dari</label><select name="fromAccountId" required>' + accountOptions_() + '</select></div>\
        <div class="field"><label>Ke</label><select name="toAccountId" required>' + accountOptions_() + '</select></div>\
      </div>\
      <div class="field"><label>Catatan</label><input type="text" name="description"></div>\
      <button class="btn btn-primary btn-block" type="submit">Simpan Transfer</button>';
  }
  function investmentForm_() {
    return '\
      <div class="field"><label>Tanggal</label><input type="date" name="date" value="' + todayIso() + '" required></div>\
      <div class="field"><label>Nama Investasi</label><input type="text" name="name" required placeholder="mis. Tabungan Emas Agustus"></div>\
      <div class="field"><label>Jenis</label><select name="invType" required><option value="CASH_SAVING">Tabungan Uang</option><option value="GOLD">Tabungan Emas</option></select></div>\
      <div class="field"><label>Jumlah Dibayar (Rp)</label><input type="number" name="amount" min="1" step="1" required></div>\
      <div class="gold-fields" style="display:none">\
        <div class="field-row">\
          <div class="field"><label>Berat Emas (gram)</label><input type="number" step="0.01" name="goldWeight"></div>\
          <div class="field"><label>Harga/gram (Rp)</label><input type="number" step="1" name="pricePerGram"></div>\
        </div>\
      </div>\
      <div class="field"><label>Dari Kantong</label><select name="accountId" required>' + accountOptions_() + '</select></div>\
      <button class="btn btn-primary btn-block" type="submit">Simpan Investasi</button>';
  }
  function debtForm_() {
    return '\
      <p style="color:var(--ink-text-dim);font-size:12px;margin-top:0">Mencatat utang baru (kamu berutang ke orang lain).</p>\
      <div class="field"><label>Nama Pemberi Utang</label><input type="text" name="personName" required></div>\
      <div class="field"><label>Tanggal</label><input type="date" name="date" value="' + todayIso() + '" required></div>\
      <div class="field"><label>Jumlah (Rp)</label><input type="number" name="totalAmount" min="1" step="1" required></div>\
      <div class="field"><label>Jatuh Tempo (opsional)</label><input type="date" name="dueDate"></div>\
      <div class="field"><label>Catatan</label><input type="text" name="description"></div>\
      <button class="btn btn-primary btn-block" type="submit">Simpan Utang</button>';
  }
  function receivableForm_() {
    return '\
      <p style="color:var(--ink-text-dim);font-size:12px;margin-top:0">Mencatat piutang baru (orang lain berutang ke kamu).</p>\
      <div class="field"><label>Nama Peminjam</label><input type="text" name="personName" required></div>\
      <div class="field"><label>Tanggal</label><input type="date" name="date" value="' + todayIso() + '" required></div>\
      <div class="field"><label>Jumlah (Rp)</label><input type="number" name="totalAmount" min="1" step="1" required></div>\
      <div class="field"><label>Dari Kantong</label><select name="accountId" required>' + accountOptions_() + '</select></div>\
      <div class="field"><label>Jatuh Tempo (opsional)</label><input type="date" name="dueDate"></div>\
      <button class="btn btn-primary btn-block" type="submit">Simpan Piutang</button>';
  }

  function formData_(form) {
    var fd = new FormData(form);
    var obj = {};
    fd.forEach(function (v, k) { obj[k] = v; });
    return obj;
  }

  async function submitTransfer_(form) {
    try { await Api.createTransfer(formData_(form)); Modal.close(); Toast.success('Transfer tersimpan.'); Router.refresh(); }
    catch (e) { Toast.error(e.message); }
  }
  async function submitInvestment_(form) {
    var data = formData_(form);
    data.type = data.invType; delete data.invType;
    try { await Api.createInvestment(data); Modal.close(); Toast.success('Investasi tersimpan.'); Router.refresh(); }
    catch (e) { Toast.error(e.message); }
  }
  async function submitDebt_(form) {
    try { await Api.createDebt(formData_(form)); Modal.close(); Toast.success('Utang tersimpan.'); Router.refresh(); }
    catch (e) { Toast.error(e.message); }
  }
  async function submitReceivable_(form) {
    try { await Api.createReceivable(formData_(form)); Modal.close(); Toast.success('Piutang tersimpan.'); Router.refresh(); }
    catch (e) { Toast.error(e.message); }
  }

  return { open: open };
})();
