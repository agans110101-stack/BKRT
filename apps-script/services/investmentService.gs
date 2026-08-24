/**
 * investmentService.gs
 * Pembelian investasi BUKAN expense konsumtif -> account berkurang,
 * nilai investasi bertambah, net asset tetap sama (perpindahan bentuk aset).
 *
 * Harga emas per gram diupdate MANUAL oleh user lewat tombol "Update Harga
 * Emas" di Settings (bukan tarik dari API luar, sesuai instruksi).
 */

var INVESTMENT_TYPE = { CASH_SAVING: 'CASH_SAVING', GOLD: 'GOLD' };

function createInvestment(userId, payload) {
  requireFields_(payload, ['date', 'name', 'type', 'accountId', 'amount']);
  var amount = validateAmount_(payload.amount);
  validateDate_(payload.date);
  validateAccountActive_(payload.accountId);

  if (payload.type !== INVESTMENT_TYPE.CASH_SAVING && payload.type !== INVESTMENT_TYPE.GOLD) {
    throw new AppError_('INVALID_TYPE', 'Tipe investasi harus CASH_SAVING atau GOLD.');
  }
  if (payload.type === INVESTMENT_TYPE.GOLD) {
    requireFields_(payload, ['goldWeight', 'pricePerGram']);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    validateSufficientBalance_(payload.accountId, amount);

    var investment = {
      investmentId: generateId('INVESTMENTS'),
      userId: userId,
      date: payload.date,
      name: payload.name,
      type: payload.type,
      accountId: payload.accountId,
      amount: amount,
      goldWeight: payload.type === INVESTMENT_TYPE.GOLD ? toNumber_(payload.goldWeight) : '',
      pricePerGram: payload.type === INVESTMENT_TYPE.GOLD ? toNumber_(payload.pricePerGram) : '',
      currentValue: amount, // saat pembelian, nilai saat ini = nilai beli
      status: STATUS.ACTIVE,
      description: payload.description || '',
      createdAt: nowIso_(),
      updatedAt: nowIso_()
    };
    insertRow(SHEET_NAMES.INVESTMENTS, investment);
    writeLedgerEntry_(userId, payload.date, TX_TYPE.INVESTMENT, investment.investmentId, payload.accountId, amount, '', payload.description || payload.name);
    logAudit_(userId, 'CREATE', 'INVESTMENTS', investment.investmentId, null, investment);
    return investment;
  } finally {
    lock.releaseLock();
  }
}

function listInvestments(type) {
  var filters = { status: STATUS.ACTIVE };
  if (type) filters.type = type;
  var rows = findRows(SHEET_NAMES.INVESTMENTS, filters);
  rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  return rows.map(withoutRowMeta_);
}

/**
 * Tombol "Update Harga Emas": diberi harga per gram baru, dihitung ulang
 * currentValue SEMUA investasi emas aktif = goldWeight * newPricePerGram.
 * Tidak mengubah saldo account manapun (ini cuma re-valuasi aset).
 */
function updateGoldPrice(userId, newPricePerGram) {
  var price = validateAmount_(newPricePerGram);
  var goldInvestments = findRows(SHEET_NAMES.INVESTMENTS, { type: INVESTMENT_TYPE.GOLD, status: STATUS.ACTIVE });

  goldInvestments.forEach(function (inv) {
    var newValue = toNumber_(inv.goldWeight) * price;
    updateRow(SHEET_NAMES.INVESTMENTS, 'investmentId', inv.investmentId, {
      pricePerGram: price,
      currentValue: newValue,
      updatedAt: nowIso_()
    });
  });

  // Simpan harga emas terakhir di SETTINGS supaya bisa ditampilkan di form beli emas berikutnya.
  upsertSetting_('LAST_GOLD_PRICE_PER_GRAM', price);
  logAudit_(userId, 'UPDATE_GOLD_PRICE', 'INVESTMENTS', 'ALL_GOLD', null, { pricePerGram: price });

  return { updatedCount: goldInvestments.length, newPricePerGram: price };
}

function getTotalInvestmentValue() {
  var rows = findRows(SHEET_NAMES.INVESTMENTS, { status: STATUS.ACTIVE });
  return sumBy_(rows, 'currentValue');
}

function upsertSetting_(key, value) {
  var existing = findRows(SHEET_NAMES.SETTINGS, { key: key })[0];
  if (existing) {
    var sheet = getSheet(SHEET_NAMES.SETTINGS);
    sheet.getRange(existing._row, 2, 1, 2).setValues([[value, nowIso_()]]);
  } else {
    insertRow(SHEET_NAMES.SETTINGS, { key: key, value: value, updatedAt: nowIso_() });
  }
}

function getSetting_(key) {
  var existing = findRows(SHEET_NAMES.SETTINGS, { key: key })[0];
  return existing ? existing.value : null;
}
