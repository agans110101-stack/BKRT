/**
 * investment.js
 */
var PageInvestment = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Investasi</h1></div><div class="skeleton" style="height:300px"></div>';

    var rows;
    try { rows = await Api.investments(); } catch (e) { Toast.error(e.message); return; }

    var goldRows = rows.filter(function (r) { return r.type === 'GOLD'; });
    var totalGoldWeight = goldRows.reduce(function (s, r) { return s + Number(r.goldWeight || 0); }, 0);
    var totalValue = rows.reduce(function (s, r) { return s + Number(r.currentValue || 0); }, 0);
    var lastPrice = goldRows.length ? goldRows[goldRows.length - 1].pricePerGram : '';

    root.innerHTML = '\
      <div class="content-header">\
        <h1>Investasi</h1>\
        <button class="btn btn-ghost btn-sm" id="btnGoldPrice">Update Harga Emas</button>\
      </div>\
      <div class="grid grid-3" style="margin-bottom:24px">\
        ' + statCard_('Total nilai investasi', totalValue, 'amber', 'investment') + '\
        <div class="card"><div class="card-label">Total Emas</div><div class="card-value mono">' + totalGoldWeight.toFixed(2) + ' gram</div></div>\
        <div class="card"><div class="card-label">Harga Emas Terakhir</div><div class="card-value money">' + (lastPrice ? formatRupiah(lastPrice) + '/gr' : '-') + '</div></div>\
      </div>\
      <div class="card"><div class="table-wrap"><table class="ledger">\
        <thead><tr><th>Tanggal</th><th>Nama</th><th>Jenis</th><th class="num">Berat (gr)</th><th class="num">Nilai Beli</th><th class="num">Nilai Sekarang</th></tr></thead>\
        <tbody id="inv-body"></tbody>\
      </table></div></div>';

    var tbody = root.querySelector('#inv-body');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><div class="empty-title">Belum ada investasi tercatat</div>Tekan tombol + untuk menambah.</div></td></tr>';
    } else {
      tbody.innerHTML = rows.map(function (r) {
        return '<tr>\
          <td>' + formatDateShort(r.date) + '</td>\
          <td>' + r.name + '</td>\
          <td>' + (r.type === 'GOLD' ? 'Emas' : 'Tabungan') + '</td>\
          <td class="num mono">' + (r.goldWeight || '-') + '</td>\
          <td class="num money">' + formatRupiah(r.amount) + '</td>\
          <td class="num money money-pos">' + formatRupiah(r.currentValue) + '</td>\
        </tr>';
      }).join('');
    }

    root.querySelector('#btnGoldPrice').onclick = function () { openGoldPriceForm_(root, lastPrice); };
  }
};

function openGoldPriceForm_(root, currentPrice) {
  var form = document.createElement('form');
  form.innerHTML = '\
    <p style="color:var(--ink-text-dim);font-size:12.5px;margin-top:0">Update ini akan menghitung ulang nilai SEMUA investasi emas aktif. Tidak mengubah saldo kantong manapun.</p>\
    <div class="field"><label>Harga Emas per Gram (Rp)</label><input type="number" name="pricePerGram" min="1" value="' + (currentPrice || '') + '" required></div>\
    <button class="btn btn-primary btn-block" type="submit">Update Harga</button>';

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var price = form.pricePerGram.value;
    try {
      var res = await Api.updateGoldPrice(price);
      Modal.close();
      Toast.success('Harga emas diupdate untuk ' + res.updatedCount + ' entri investasi.');
      PageInvestment.render(root);
    } catch (err) { Toast.error(err.message); }
  });

  Modal.open('Update Harga Emas', form);
}
