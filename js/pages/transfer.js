/**
 * transfer.js
 */
var PageTransfer = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Transfer</h1></div><div class="skeleton" style="height:300px"></div>';
    await Store.ensureAccounts();

    var rows;
    try { rows = await Api.transfers({}); } catch (e) { Toast.error(e.message); return; }

    root.innerHTML = '\
      <div class="content-header"><h1>Transfer</h1></div>\
      <p style="color:var(--ink-text-dim);font-size:12.5px;margin-top:-12px;margin-bottom:16px">Perpindahan dana antar kantong tidak dihitung sebagai income/expense.</p>\
      <div class="card"><div class="table-wrap"><table class="ledger">\
        <thead><tr><th>Tanggal</th><th>Dari</th><th>Ke</th><th>Catatan</th><th class="num">Jumlah</th><th></th></tr></thead>\
        <tbody id="transfer-body"></tbody>\
      </table></div></div>';

    var tbody = root.querySelector('#transfer-body');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><div class="empty-title">Belum ada transfer tercatat</div></div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      var reversed = r.status === 'REVERSED';
      return '<tr' + (reversed ? ' style="opacity:.45;text-decoration:line-through"' : '') + '>\
        <td>' + formatDateShort(r.date) + '</td>\
        <td>' + Store.accountName(r.fromAccountId) + '</td>\
        <td>' + Store.accountName(r.toAccountId) + '</td>\
        <td>' + (r.description || '-') + '</td>\
        <td class="num money">' + formatRupiah(r.amount) + '</td>\
        <td>' + (reversed ? '' : '<button class="btn btn-ghost btn-sm" data-reverse-transfer="' + r.transferId + '" style="text-decoration:none">Batalkan</button>') + '</td>\
      </tr>';
    }).join('');

    tbody.querySelectorAll('[data-reverse-transfer]').forEach(function (btn) {
      btn.onclick = function () { confirmReverse_('transfer', btn.dataset.reverseTransfer, function () { PageTransfer.render(root); }); };
    });
  }
};
