/**
 * config.gs
 * Konstanta global: nama sheet, header kolom, pengaturan sesi.
 * Ubah SPREADSHEET_ID sesuai spreadsheet database kamu.
 */

// ID Google Spreadsheet yang dipakai sebagai database.
// Ambil dari URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
var SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU';

var SHEET_NAMES = {
  USERS: 'USERS',
  ACCOUNTS: 'ACCOUNTS',
  CATEGORIES: 'CATEGORIES',
  INCOME: 'INCOME',
  EXPENSES: 'EXPENSES',
  TRANSFERS: 'TRANSFERS',
  BUDGETS: 'BUDGETS',
  INVESTMENTS: 'INVESTMENTS',
  DEBTS: 'DEBTS',
  DEBT_PAYMENTS: 'DEBT_PAYMENTS',
  RECEIVABLES: 'RECEIVABLES',
  RECEIVABLE_PAYMENTS: 'RECEIVABLE_PAYMENTS',
  TRANSACTIONS: 'TRANSACTIONS',
  SETTINGS: 'SETTINGS',
  AUDIT_LOGS: 'AUDIT_LOGS'
};

// Header kolom persis sesuai urutan di spreadsheet.
var SHEET_HEADERS = {
  USERS: ['userId', 'name', 'username', 'passwordHash', 'passwordSalt', 'role', 'isActive', 'createdAt', 'updatedAt'],
  ACCOUNTS: ['accountId', 'userId', 'name', 'type', 'initialBalance', 'currency', 'description', 'isActive', 'createdAt', 'updatedAt'],
  CATEGORIES: ['categoryId', 'userId', 'name', 'type', 'icon', 'color', 'isActive', 'createdAt', 'updatedAt'],
  INCOME: ['incomeId', 'userId', 'date', 'amount', 'source', 'categoryId', 'accountId', 'description', 'status', 'createdAt', 'updatedAt', 'infaqStatus'],
  EXPENSES: ['expenseId', 'userId', 'date', 'amount', 'categoryId', 'accountId', 'description', 'status', 'createdAt', 'updatedAt'],
  TRANSFERS: ['transferId', 'userId', 'date', 'fromAccountId', 'toAccountId', 'amount', 'description', 'status', 'createdAt', 'updatedAt'],
  BUDGETS: ['budgetId', 'userId', 'month', 'year', 'categoryId', 'budgetAmount', 'createdAt', 'updatedAt'],
  INVESTMENTS: ['investmentId', 'userId', 'date', 'name', 'type', 'accountId', 'amount', 'goldWeight', 'pricePerGram', 'currentValue', 'status', 'description', 'createdAt', 'updatedAt'],
  DEBTS: ['debtId', 'userId', 'personName', 'totalAmount', 'remainingAmount', 'date', 'dueDate', 'status', 'description', 'createdAt', 'updatedAt'],
  DEBT_PAYMENTS: ['paymentId', 'debtId', 'userId', 'date', 'amount', 'accountId', 'description', 'status', 'createdAt'],
  RECEIVABLES: ['receivableId', 'userId', 'personName', 'totalAmount', 'remainingAmount', 'date', 'dueDate', 'status', 'description', 'createdAt', 'updatedAt'],
  RECEIVABLE_PAYMENTS: ['paymentId', 'receivableId', 'userId', 'date', 'amount', 'accountId', 'description', 'status', 'createdAt'],
  TRANSACTIONS: ['transactionId', 'userId', 'date', 'type', 'referenceId', 'accountId', 'amount', 'categoryId', 'description', 'createdAt'],
  SETTINGS: ['key', 'value', 'updatedAt'],
  AUDIT_LOGS: ['logId', 'userId', 'action', 'entity', 'entityId', 'oldValue', 'newValue', 'timestamp']
};

var SESSION_DURATION_SECONDS = 6 * 60 * 60; // 6 jam
var CACHE_TTL_SECONDS = 5 * 60; // 5 menit untuk data yang jarang berubah

var STATUS = {
  ACTIVE: 'ACTIVE',
  REVERSED: 'REVERSED'
};

var TX_TYPE = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  INVESTMENT: 'INVESTMENT',
  DEBT: 'DEBT',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  RECEIVABLE: 'RECEIVABLE',
  RECEIVABLE_PAYMENT: 'RECEIVABLE_PAYMENT'
};

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
