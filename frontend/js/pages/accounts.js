/**
 * accounts.js
 */
var PageAccounts = {
  async render(root, params) {
    if (params && params[0]) return this.renderDetail(root, params[0]);

    root.innerHTML = '<div class="content-header"><h1>Kantong</h1></div><div class="skeleton" style="height:200px"></div>';
    var accounts;
    try { accounts = await Api.accounts(); } catch (e) { Toast.error(e.message); return; }

    root.innerHTML = '\
      <div class="content-header">\
        <h1>Kantong</h1>\
        <button class="btn btn-ghost btn-sm" id="btnNewAccount">+ Kantong Baru</button>\
      </div>\
      <div class="grid grid-3" id="account-grid"></div>';

    var grid = root.querySelector('#account-grid');
    grid.innerHTML = accounts.map(function (a) {
      return '<a class="card" href="#/accounts/' + a.accountId + '" style="text-decoration:none;display:block">\
        <div class="card-label">' + a.name + ' &middot; ' + a.type + '</div>\
        <div class="card-value money">' + formatRupiah(a.balance) + '</div>\
      </a>';
    }).join('');

    root.querySelector('#btnNewAccount').onclick = function () { openNewAccountForm_(root); };
  },

  async renderDetail(root, accountId) {
    root.innerHTML = '<div class="skeleton" style="height:300px"></div>';
    var detail;
    try { detail = await Api.accountDetail(accountId); } catch (e) { Toast.error(e.message); return; }
    await Promise.all([Store.ensureAccounts(), Store.ensureCategories()]);

    root.innerHTML = '\
      <div class="content-header">\
        <div><a href="#/accounts" style="color:var(--ink-text-dim);font-size:12px">&larr; Kantong</a><h1 style="margin-top:6px">' + detail.name + '</h1></div>\
        <div class="card" style="padding:10px 16px"><div class="card-label" style="margin-bottom:2px">Saldo</div><div class="money" style="font-size:18px">' + formatRupiah(detail.balance) + '</div></div>\
      </div>\
      <div class="card"><div class="table-wrap"><table class="ledger">\
        <thead><tr><th>Tanggal</th><th>Tipe</th><th>Catatan</th><th class="num">Jumlah</th></tr></thead>\
        <tbody>' + (detail.transactions.length ? detail.transactions.map(function (t) {
          var isIn = ['INCOME', 'TRANSFER_IN', 'RECEIVABLE_PAYMENT'].indexOf(t.type) !== -1;
          return '<tr>\
            <td>' + formatDateShort(t.date) + '</td>\
            <td>' + t.type.replace('_', ' ') + '</td>\
            <td>' + (t.description || '-') + '</td>\
            <td class="num money ' + (isIn ? 'money-pos' : 'money-neg') + '">' + (isIn ? '+' : '-') + formatRupiah(Math.abs(t.amount)) + '</td>\
          </tr>';
        }).join('') : '<tr><td colspan="4"><div class="empty">Belum ada histori transaksi.</div></td></tr>') + '</tbody>\
      </table></div></div>';
  }
};

function openNewAccountForm_(root) {
  var form = document.createElement('form');
  form.innerHTML = '\
    <div class="field"><label>Nama Kantong</label><input type="text" name="name" required placeholder="mis. Rekening Baru"></div>\
    <div class="field"><label>Tipe</label><select name="type"><option>Bank Account</option><option>Cash</option><option>Debit Card</option><option>Credit Card</option><option>E-Wallet</option></select></div>\
    <div class="field"><label>Saldo Awal (Rp)</label><input type="number" name="initialBalance" value="0"></div>\
    <button class="btn btn-primary btn-block" type="submit">Simpan Kantong</button>';
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form); var data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    try { await Api.createAccount(data); Modal.close(); Toast.success('Kantong baru ditambahkan.'); Store.invalidateAll(); PageAccounts.render(root); }
    catch (err) { Toast.error(err.message); }
  });
  Modal.open('Kantong Baru', form);
}
