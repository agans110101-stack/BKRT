/**
 * infaq.js
 * Dashboard khusus Infaq. TIDAK ada database baru -- murni view yang narik
 * data dari Income (Api.incomes) dan menghitung 2.5% on-the-fly. Tabel
 * sengaja dibikin minim kolom: Tanggal, Sumber, Jumlah, Infaq.
 * Tiap baris NOT YET ada checkbox -> bisa tandai infaq banyak sekaligus.
 */
var PageInfaq = {
  async render(root) {
    root.innerHTML = '<div class="content-header"><h1>Infaq</h1></div><div class="skeleton" style="height:300px"></div>';

    var allRows;
    try { allRows = await Api.incomes({}); } catch (e) { Toast.error(e.message); return; }
    allRows = allRows.filter(function (r) { return r.status !== 'REVERSED'; });

    var totalOwedAll = allRows.filter(function (r) { return r.infaqStatus !== 'DONE'; })
      .reduce(function (s, r) { return s + Number(r.amount) * 0.025; }, 0);

    root.innerHTML = '\
      <div class="content-header">\
        <h1>Infaq</h1>\
        <div class="card" style="padding:10px 16px"><div class="card-label" style="margin-bottom:2px">Total Belum Dibayar</div><div class="money" style="font-size:16px;color:var(--orange)">' + formatRupiah(totalOwedAll) + '</div></div>\
      </div>\
      <div class="control-group" style="margin-bottom:16px">\
        <div class="field" style="margin-bottom:0"><label>' + Icons.misc('filter', 12) + ' Bulan</label><input type="month" id="filter-month"></div>\
        <div class="field" style="margin-bottom:0"><label>Status</label><select id="filter-status">\
          <option value="">Semua Status</option>\
          <option value="NOT_YET">Belum Diinfaqkan</option>\
          <option value="DONE">Sudah Diinfaqkan</option>\
        </select></div>\
        <button class="btn btn-ghost btn-sm" id="btnResetFilter" style="align-self:flex-end">Reset</button>\
        <button class="btn btn-primary btn-sm" id="btnBulkMark" style="align-self:flex-end" disabled>Tandai Terpilih (0)</button>\
      </div>\
      <div class="card"><div class="table-wrap"><table class="ledger">\
        <thead><tr><th>Tanggal</th><th>Sumber</th><th class="num">Jumlah</th><th>Infaq (2.5%)</th></tr></thead>\
        <tbody id="infaq-body"></tbody>\
        <tfoot>\
          <tr><td colspan="2" style="text-align:right;font-weight:600">Total Jumlah (sesuai filter)</td><td class="num money money-pos" id="income-total" style="font-weight:600"></td><td></td></tr>\
          <tr><td colspan="3" style="text-align:right;font-weight:600;color:var(--orange)">Kewajiban Infaq Belum Dibayar</td><td class="num money" id="infaq-total" style="font-weight:600;color:var(--orange)"></td></tr>\
        </tfoot>\
      </table></div></div>';

    var tbody = root.querySelector('#infaq-body');
    var incomeTotalEl = root.querySelector('#income-total');
    var infaqTotalEl = root.querySelector('#infaq-total');
    var monthEl = root.querySelector('#filter-month');
    var statusEl = root.querySelector('#filter-status');
    var bulkBtn = root.querySelector('#btnBulkMark');

    function applyFilters_() {
      var rows = allRows;
      if (monthEl.value) rows = rows.filter(function (r) { return (r.date || '').slice(0, 7) === monthEl.value; });
      if (statusEl.value) rows = rows.filter(function (r) { return (r.infaqStatus || 'NOT_YET') === statusEl.value; });
      draw(rows);
    }

    function updateBulkButton_() {
      var n = tbody.querySelectorAll('.infaq-check:checked').length;
      bulkBtn.textContent = 'Tandai Terpilih (' + n + ')';
      bulkBtn.disabled = n === 0;
    }

    function draw(rows) {
      bulkBtn.disabled = true;
      bulkBtn.textContent = 'Tandai Terpilih (0)';

      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4"><div class="empty"><div class="empty-title">Tidak ada data</div>Coba ubah filter.</div></td></tr>';
        incomeTotalEl.textContent = formatRupiah(0);
        infaqTotalEl.textContent = formatRupiah(0);
        return;
      }

      tbody.innerHTML = rows.map(function (r) {
        var infaqDone = r.infaqStatus === 'DONE';
        var infaqAmount = Number(r.amount) * 0.025;
        return '<tr>\
          <td>' + formatDateShort(r.date) + '</td>\
          <td>' + (r.source || '-') + '</td>\
          <td class="num money money-pos">+' + formatRupiah(r.amount) + '</td>\
          <td class="col-infaq">\
            <div class="infaq-cell">\
              <span class="stamp ' + (infaqDone ? 'stamp-paid' : 'stamp-unpaid') + '">' + (infaqDone ? 'DONE' : 'NOT YET') + '</span>\
              <span class="mono infaq-amt">' + formatRupiah(infaqAmount) + '</span>\
              <span class="infaq-action">' + (infaqDone ? '' :
                '<button class="btn btn-ghost btn-sm" data-mark-infaq="' + r.incomeId + '">Tandai Infaq</button>' +
                '<input type="checkbox" class="infaq-check" data-check-id="' + r.incomeId + '" title="Pilih untuk tandai beberapa sekaligus">'
              ) + '</span>\
            </div>\
          </td>\
        </tr>';
      }).join('');

      var totalIncome = rows.reduce(function (s, r) { return s + Number(r.amount); }, 0);
      incomeTotalEl.textContent = formatRupiah(totalIncome);

      var totalOwed = rows.filter(function (r) { return r.infaqStatus !== 'DONE'; })
        .reduce(function (s, r) { return s + Number(r.amount) * 0.025; }, 0);
      infaqTotalEl.textContent = formatRupiah(totalOwed);

      tbody.querySelectorAll('[data-mark-infaq]').forEach(function (btn) {
        btn.onclick = async function () {
          btn.disabled = true;
          try {
            await Api.markInfaqDone(btn.dataset.markInfaq);
            Toast.success('Ditandai sudah diinfaqkan.');
            PageInfaq.render(root);
          } catch (e) { Toast.error(e.message); btn.disabled = false; }
        };
      });

      tbody.querySelectorAll('.infaq-check').forEach(function (chk) {
        chk.onchange = updateBulkButton_;
      });
    }

    bulkBtn.onclick = async function () {
      var ids = Array.from(tbody.querySelectorAll('.infaq-check:checked')).map(function (c) { return c.dataset.checkId; });
      if (!ids.length) return;
      bulkBtn.disabled = true;
      bulkBtn.textContent = 'Menandai...';

      var success = 0, firstError = null;
      for (var i = 0; i < ids.length; i++) {
        try { await Api.markInfaqDone(ids[i]); success++; }
        catch (e) { firstError = e.message; break; }
      }

      if (success === ids.length) {
        Toast.success(success + ' income ditandai sudah diinfaqkan.');
      } else {
        Toast.error(success + ' berhasil, berhenti karena: ' + firstError);
      }
      PageInfaq.render(root);
    };

    draw(allRows);
    monthEl.onchange = applyFilters_;
    statusEl.onchange = applyFilters_;
    root.querySelector('#btnResetFilter').onclick = function () {
      monthEl.value = ''; statusEl.value = '';
      draw(allRows);
    };
  }
};
