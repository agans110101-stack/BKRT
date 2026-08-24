/**
 * api.js
 * Semua komunikasi ke backend Apps Script lewat sini.
 *
 * PENTING: ganti API_BASE_URL di bawah dengan Web App URL hasil deploy kamu
 * (lihat apps-script/README.md langkah 3).
 */

var API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwilU1Z-SosE7ov3LuhyIDOE6vmzpKKxnZkA1U6MEGM1VXjbkBOdK7erh7f6SKGLUAA/exec';

var Api = (function () {
  function getToken() {
    return localStorage.getItem('hf_token');
  }
  function setToken(token) {
    if (token) localStorage.setItem('hf_token', token);
    else localStorage.removeItem('hf_token');
  }

  function get(action, params) {
    params = params || {};
    params.action = action;
    params.token = getToken();
    var qs = Object.keys(params)
      .filter(function (k) { return params[k] !== undefined && params[k] !== null; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
      .join('&');
    return fetch(API_BASE_URL + '?' + qs, { method: 'GET' }).then(handleResponse_);
  }

  /**
   * POST WAJIB pakai Content-Type text/plain supaya browser tidak mengirim
   * preflight OPTIONS (Apps Script Web App tidak bisa menangani itu).
   */
  function post(action, payload) {
    payload = payload || {};
    payload.action = action;
    payload.token = getToken();
    return fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(handleResponse_);
  }

  function handleResponse_(res) {
    return res.json().then(function (json) {
      if (!json.success) {
        if (json.code === 'SESSION_EXPIRED' || json.code === 'UNAUTHORIZED') {
          if (window.Router && Router.goToLogin) Router.goToLogin();
          else { setToken(null); window.location.hash = '#/login'; }
        }
        var err = new Error(json.message || 'Terjadi kesalahan.');
        err.code = json.code;
        throw err;
      }
      return json.data;
    });
  }

  return {
    getToken: getToken,
    setToken: setToken,
    get: get,
    post: post,

    login: function (username, password) { return post('login', { username: username, password: password }); },
    logout: function () { return post('logout', {}); },

    dashboard: function () { return get('dashboard'); },
    reportIncomeExpense: function (monthsBack) { return get('reportIncomeExpense', { monthsBack: monthsBack }); },
    reportExpenseByCategory: function (month, year) { return get('reportExpenseByCategory', { month: month, year: year }); },
    reportBalancePerAccount: function () { return get('reportBalancePerAccount'); },
    reportCashFlow: function (monthsBack) { return get('reportCashFlow', { monthsBack: monthsBack }); },
    reportNetWorthTrend: function (monthsBack) { return get('reportNetWorthTrend', { monthsBack: monthsBack }); },

    accounts: function () { return get('accounts'); },
    accountDetail: function (accountId) { return get('accountDetail', { accountId: accountId }); },
    createAccount: function (payload) { return post('createAccount', payload); },

    categories: function () { return get('categories'); },

    transactions: function (filters) { return get('transactions', filters); },

    incomes: function (filters) { return get('incomes', filters); },
    createIncome: function (payload) { return post('createIncome', payload); },
    reverseIncome: function (incomeId, reason) { return post('reverseIncome', { incomeId: incomeId, reason: reason }); },
    markInfaqDone: function (incomeId) { return post('markInfaqDone', { incomeId: incomeId }); },
    markInfaqNotYet: function (incomeId) { return post('markInfaqNotYet', { incomeId: incomeId }); },
    infaqSummary: function () { return get('infaqSummary'); },

    expenses: function (filters) { return get('expenses', filters); },
    createExpense: function (payload) { return post('createExpense', payload); },
    reverseExpense: function (expenseId, reason) { return post('reverseExpense', { expenseId: expenseId, reason: reason }); },

    transfers: function (filters) { return get('transfers', filters); },
    createTransfer: function (payload) { return post('createTransfer', payload); },
    reverseTransfer: function (transferId, reason) { return post('reverseTransfer', { transferId: transferId, reason: reason }); },

    budgets: function (month, year) { return get('budgets', { month: month, year: year }); },
    createBudget: function (payload) { return post('createBudget', payload); },
    updateBudget: function (budgetId, payload) { payload.budgetId = budgetId; return post('updateBudget', payload); },

    investments: function (type) { return get('investments', { type: type }); },
    createInvestment: function (payload) { return post('createInvestment', payload); },
    updateGoldPrice: function (pricePerGram) { return post('updateGoldPrice', { pricePerGram: pricePerGram }); },

    debts: function () { return get('debts'); },
    createDebt: function (payload) { return post('createDebt', payload); },
    createDebtPayment: function (payload) { return post('createDebtPayment', payload); },

    receivables: function () { return get('receivables'); },
    createReceivable: function (payload) { return post('createReceivable', payload); },
    createReceivablePayment: function (payload) { return post('createReceivablePayment', payload); }
  };
})();
