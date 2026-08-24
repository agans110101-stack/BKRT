/**
 * state.js
 * Cache in-memory sederhana untuk data yang sering dipakai ulang di banyak
 * form (accounts, categories) supaya tidak fetch berkali-kali dalam satu sesi.
 * Bukan sumber kebenaran -- selalu boleh di-invalidate & fetch ulang.
 */

var Store = {
  user: null, // { userId, name, role }
  accounts: [],
  categories: [],

  async ensureAccounts(force) {
    if (!force && this.accounts.length) return this.accounts;
    this.accounts = await Api.accounts();
    return this.accounts;
  },

  async ensureCategories(force) {
    if (!force && this.categories.length) return this.categories;
    this.categories = await Api.categories();
    return this.categories;
  },

  categoriesByType(type) {
    return this.categories.filter(function (c) { return c.type === type; });
  },

  accountName(accountId) {
    var acc = this.accounts.find(function (a) { return a.accountId === accountId; });
    return acc ? acc.name : accountId;
  },

  categoryName(categoryId) {
    var cat = this.categories.find(function (c) { return c.categoryId === categoryId; });
    return cat ? cat.name : categoryId;
  },

  invalidateAll() {
    this.accounts = [];
    this.categories = [];
  }
};

function formatRupiah(n) {
  n = Number(n) || 0;
  var sign = n < 0 ? '-' : '';
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayIso() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
