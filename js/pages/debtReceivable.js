/**
 * debtReceivable.js
 */
var PageDebtReceivable = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Utang & Piutang</h1></div><div class="skeleton" style="height:300px"></div>';
    await Store.ensureAccounts();

    var debts, receivables;
    try {
      var results = await Promise.all([Api.debts(), Api.receivables()]);
      debts = results[0]; receivables = results[1];
    } catch (e) { Toast.error(e.message); return; }

    var totalDebt = debts.filter(function (d) { return d.status !== 'PAID'; }).reduce(function (s, d) { return s + Number(d.remainingAmount); }, 0);
    var totalReceivable = receivables.filter(function (r) { return r.status !== 'PAID'; }).reduce(function (s, r) { return s + Number(r.remainingAmount); }, 0);

    root.innerHTML = '\
      <div class="content-header"><h1>Utang & Piutang</h1></div>\
      <div class="grid grid-2" style="margin-bottom:24px">\
        <div class="card"><div class="card-label">Total Utang</div><div class="card-value money money-neg">' + formatRupiah(totalDebt) + '</div></div>\
        <div class="card"><div class="card-label">Total Piutang</div><div class="card-value money money-pos">' + formatRupiah(totalReceivable) + '</div></div>\
      </div>\
      <div class="grid grid-2">\
        <div>\
          <h2 style="margin-bottom:12px">Utang (Saya Berutang)</h2>\
          <div class="card"><div class="table-wrap"><table class="ledger">\
            <thead><tr><th>Ke</th><th class="num">Sisa</th><th>Status</th><th></th></tr></thead>\
            <tbody id="debt-body"></tbody>\
          </table></div></div>\
        </div>\
        <div>\
          <h2 style="margin-bottom:12px">Piutang (Orang Berutang ke Saya)</h2>\
          <div class="card"><div class="table-wrap"><table class="ledger">\
            <thead><tr><th>Dari</th><th class="num">Sisa</th><th>Status</th><th></th></tr></thead>\
            <tbody id="recv-body"></tbody>\
          </table></div></div>\
        </div>\
      </div>';

    var debtBody = root.querySelector('#debt-body');
    debtBody.innerHTML = !debts.length
      ? '<tr><td colspan="4"><div class="empty">Belum ada utang tercatat.</div></td></tr>'
      : debts.map(function (d) {
          return '<tr>\
            <td>' + d.personName + '</td>\
            <td class="num money">' + formatRupiah(d.remainingAmount) + '</td>\
            <td><span class="stamp stamp-animate stamp-' + d.status.toLowerCase() + '">' + d.status + '</span></td>\
            <td>' + (d.status !== 'PAID' ? '<button class="btn btn-ghost btn-sm" data-debt="' + d.debtId + '">Bayar</button>' : '') + '</td>\
          </tr>';
        }).join('');

    var recvBody = root.querySelector('#recv-body');
    recvBody.innerHTML = !receivables.length
      ? '<tr><td colspan="4"><div class="empty">Belum ada piutang tercatat.</div></td></tr>'
      : receivables.map(function (r) {
          return '<tr>\
            <td>' + r.personName + '</td>\
            <td class="num money">' + formatRupiah(r.remainingAmount) + '</td>\
            <td><span class="stamp stamp-animate stamp-' + r.status.toLowerCase() + '">' + r.status + '</span></td>\
            <td>' + (r.status !== 'PAID' ? '<button class="btn btn-ghost btn-sm" data-recv="' + r.receivableId + '">Terima</button>' : '') + '</td>\
          </tr>';
        }).join('');

    debtBody.querySelectorAll('[data-debt]').forEach(function (btn) {
      btn.onclick = function () { openDebtPaymentForm_(btn.dataset.debt, root); };
    });
    recvBody.querySelectorAll('[data-recv]').forEach(function (btn) {
      btn.onclick = function () { openReceivablePaymentForm_(btn.dataset.recv, root); };
    });
  }
};

function accountOptionsHtml_() {
  return Store.accounts.map(function (a) { return '<option value="' + a.accountId + '">' + a.name + '</option>'; }).join('');
}

function openDebtPaymentForm_(debtId, root) {
  var form = document.createElement('form');
  form.innerHTML = '\
    <div class="field"><label>Tanggal</label><input type="date" name="date" value="' + todayIso() + '" required></div>\
    <div class="field"><label>Jumlah Dibayar (Rp)</label><input type="number" name="amount" min="1" required></div>\
    <div class="field"><label>Dari Kantong</label><select name="accountId" required>' + accountOptionsHtml_() + '</select></div>\
    <input type="hidden" name="debtId" value="' + debtId + '">\
    <button class="btn btn-primary btn-block" type="submit">Bayar Utang</button>';
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form); var data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    try { await Api.createDebtPayment(data); Modal.close(); Toast.success('Pembayaran utang tersimpan.'); PageDebtReceivable.render(root); }
    catch (err) { Toast.error(err.message); }
  });
  Modal.open('Bayar Utang', form);
}

function openReceivablePaymentForm_(receivableId, root) {
  var form = document.createElement('form');
  form.innerHTML = '\
    <div class="field"><label>Tanggal</label><input type="date" name="date" value="' + todayIso() + '" required></div>\
    <div class="field"><label>Jumlah Diterima (Rp)</label><input type="number" name="amount" min="1" required></div>\
    <div class="field"><label>Masuk ke Kantong</label><select name="accountId" required>' + accountOptionsHtml_() + '</select></div>\
    <input type="hidden" name="receivableId" value="' + receivableId + '">\
    <button class="btn btn-primary btn-block" type="submit">Terima Pembayaran</button>';
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form); var data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    try { await Api.createReceivablePayment(data); Modal.close(); Toast.success('Pembayaran piutang tersimpan.'); PageDebtReceivable.render(root); }
    catch (err) { Toast.error(err.message); }
  });
  Modal.open('Terima Pembayaran Piutang', form);
}
