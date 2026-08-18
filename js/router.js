/**
 * router.js
 */
var Router = (function () {
  var ROUTES = [
    { path: 'dashboard', label: 'Dashboard', icon: '\u2302', page: PageDashboard },
    { path: 'income', label: 'Income', icon: '\u2191', page: PageIncome },
    { path: 'expense', label: 'Expense', icon: '\u2193', page: PageExpense },
    { path: 'budget', label: 'Budget Bulanan', icon: '\u25a4', page: PageBudget },
    { path: 'investment', label: 'Investasi', icon: '\u25c8', page: PageInvestment },
    { path: 'debt-receivable', label: 'Utang & Piutang', icon: '\u21c4', page: PageDebtReceivable },
    { path: 'accounts', label: 'Kantong', icon: '\u25a3', page: PageAccounts },
    { path: 'transfer', label: 'Transfer', icon: '\u21c6', page: PageTransfer },
    { path: 'reports', label: 'Laporan', icon: '\u2637', page: PageReports }
  ];

  var currentPath = null;

  function parseHash() {
    var hash = window.location.hash.replace(/^#\//, '');
    var parts = hash.split('/').filter(Boolean);
    var path = parts[0] || 'dashboard';
    var params = parts.slice(1);
    return { path: path, params: params };
  }

  function buildShell() {
    document.body.classList.remove('is-login');
    document.body.innerHTML = '\
      <div id="app">\
        <aside class="sidebar">\
          <div class="brand"><div class="brand-title">Buku Kas</div><div class="brand-sub">Keuangan Rumah Tangga</div></div>\
          <ul class="nav" id="nav-list"></ul>\
          <div style="padding:0 24px"><button class="btn btn-ghost btn-sm btn-block" id="btnLogout">Keluar</button></div>\
        </aside>\
        <div class="main">\
          <div class="topbar">\
            <div><div class="topbar-greeting">Assalamualaikum' + (Store.user && Store.user.name ? ', ' + Store.user.name : '') + '</div><div class="topbar-date" id="topbar-date"></div></div>\
          </div>\
          <div class="content" id="content"></div>\
        </div>\
      </div>\
      <nav class="bottom-nav"><div class="bottom-nav-inner" id="bottom-nav-list"></div></nav>\
      <button class="fab" id="fab-add" aria-label="Tambah transaksi">+</button>';

    document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    var navList = document.getElementById('nav-list');
    var bottomList = document.getElementById('bottom-nav-list');
    ROUTES.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = '<a href="#/' + r.path + '" data-path="' + r.path + '">' + r.label + '</a>';
      navList.appendChild(li);

      var a = document.createElement('a');
      a.href = '#/' + r.path;
      a.dataset.path = r.path;
      a.innerHTML = '<span style="font-size:16px">' + r.icon + '</span>' + r.label.split(' ')[0];
      bottomList.appendChild(a);
    });

    document.getElementById('btnLogout').onclick = async function () {
      try { await Api.logout(); } catch (e) { /* abaikan, tetap logout di sisi klien */ }
      goToLogin();
    };

    document.getElementById('fab-add').onclick = function () { QuickAdd.open(); };
  }

  function highlightNav(path) {
    document.querySelectorAll('.nav-item a, .bottom-nav a').forEach(function (a) {
      a.classList.toggle('active', a.dataset.path === path);
    });
  }

  async function navigate() {
    var route = parseHash();
    if (route.path === 'login') return; // ditangani terpisah

    var match = ROUTES.filter(function (r) { return r.path === route.path; })[0] || ROUTES[0];
    currentPath = match.path;
    highlightNav(match.path);

    var content = document.getElementById('content');
    if (!content) return;
    try {
      await match.page.render(content, route.params);
    } catch (e) {
      content.innerHTML = '<div class="empty"><div class="empty-title">Gagal memuat halaman</div>' + e.message + '</div>';
    }
  }

  function refresh() {
    navigate();
  }

  function goToLogin() {
    Api.setToken(null);
    Store.user = null;
    window.location.hash = '#/login';
    PageLogin.render(document.body);
  }

  function boot() {
    if (!Api.getToken()) {
      goToLogin();
      return;
    }
    // Kalau hash masih menunjuk ke halaman login (mis. baru saja login sukses,
    // atau sesi baru pulih) tapi kita sudah punya token valid, arahkan ke
    // dashboard supaya navigate() tidak berhenti di guard "login" di bawah.
    if (parseHash().path === 'login') {
      window.location.hash = '#/dashboard';
    }
    buildShell();
    navigate();
  }

  window.addEventListener('hashchange', function () {
    if (window.location.hash.replace(/^#\//, '') === 'login') return;
    if (!document.getElementById('content')) { boot(); return; }
    navigate();
  });

  return { boot: boot, refresh: refresh, goToLogin: goToLogin };
})();

document.addEventListener('DOMContentLoaded', function () {
  Router.boot();
});
