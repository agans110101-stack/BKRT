/**
 * accountService.gs
 * Saldo TIDAK PERNAH disimpan sebagai kolom statis. Selalu dihitung ulang
 * dari initialBalance + seluruh transaksi ACTIVE yang menyentuh account itu.
 */

function listAccounts() {
  var accounts = findRows(SHEET_NAMES.ACCOUNTS, { isActive: true });
  return accounts.map(function (acc) {
    return withoutRowMeta_(Object.assign({}, acc, { balance: calculateAccountBalance(acc.accountId) }));
  });
}

function createAccount(payload) {
  requireFields_(payload, ['name', 'type']);
  var acc = {
    accountId: generateId('ACCOUNTS'),
    userId: payload.userId || 'default',
    name: payload.name,
    type: payload.type,
    initialBalance: toNumber_(payload.initialBalance || 0),
    currency: payload.currency || 'IDR',
    description: payload.description || '',
    isActive: true,
    createdAt: nowIso_(),
    updatedAt: nowIso_()
  };
  insertRow(SHEET_NAMES.ACCOUNTS, acc);
  return acc;
}

/**
 * Menghitung saldo satu account dari seluruh ledger TRANSACTIONS (status ACTIVE saja).
 * Ini SATU-SATUNYA fungsi yang boleh dipakai untuk tahu saldo account.
 */
function calculateAccountBalance(accountId) {
  var account = findById(SHEET_NAMES.ACCOUNTS, 'accountId', accountId);
  if (!account) throw new AppError_('ACCOUNT_NOT_FOUND', 'Account tidak ditemukan: ' + accountId);

  var txs = findRows(SHEET_NAMES.TRANSACTIONS, { accountId: accountId });
  var balance = toNumber_(account.initialBalance);

  txs.forEach(function (tx) {
    var amount = toNumber_(tx.amount);
    switch (tx.type) {
      case TX_TYPE.INCOME:
      case TX_TYPE.TRANSFER_IN:
      case TX_TYPE.RECEIVABLE_PAYMENT:
        balance += amount;
        break;
      case TX_TYPE.EXPENSE:
      case TX_TYPE.TRANSFER_OUT:
      case TX_TYPE.INVESTMENT:
      case TX_TYPE.DEBT_PAYMENT:
      case TX_TYPE.RECEIVABLE: // beri piutang ke orang lain = uang keluar
        balance -= amount;
        break;
      // TX_TYPE.DEBT (menerima utang) tidak otomatis menambah saldo account
      // di ledger utama; penambahan saldo saat menerima uang utang dicatat
      // sebagai baris INCOME terpisah oleh debtService jika relevan.
      default:
        break;
    }
  });

  return balance;
}

function calculateAllAccountBalances() {
  var accounts = findRows(SHEET_NAMES.ACCOUNTS, { isActive: true });
  var result = {};
  accounts.forEach(function (acc) {
    result[acc.accountId] = calculateAccountBalance(acc.accountId);
  });
  return result;
}

function getAccountDetail(accountId) {
  var account = findById(SHEET_NAMES.ACCOUNTS, 'accountId', accountId);
  if (!account) throw new AppError_('ACCOUNT_NOT_FOUND', 'Account tidak ditemukan: ' + accountId);

  var txs = findRows(SHEET_NAMES.TRANSACTIONS, { accountId: accountId })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  return withoutRowMeta_(Object.assign({}, account, {
    balance: calculateAccountBalance(accountId),
    transactions: txs.map(withoutRowMeta_)
  }));
}

function withoutRowMeta_(obj) {
  var copy = Object.assign({}, obj);
  delete copy._row;
  return copy;
}
