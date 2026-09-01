/**
 * router.js
 */
var Router = (function () {
  var ROUTES = [
    { path: 'dashboard', label: 'Dashboard', iconKey: 'dashboard', page: PageDashboard },
    { path: 'income', label: 'Income', iconKey: 'income', page: PageIncome },
    { path: 'infaq', label: 'Infaq', iconKey: 'infaq', page: PageInfaq },
    { path: 'expense', label: 'Expense', iconKey: 'expense', page: PageExpense },
    { path: 'budget', label: 'Budget Bulanan', iconKey: 'budget', page: PageBudget },
    { path: 'investment', label: 'Investasi', iconKey: 'investment', page: PageInvestment },
    { path: 'debt-receivable', label: 'Utang & Piutang', iconKey: 'debtReceivable', page: PageDebtReceivable },
    { path: 'accounts', label: 'Kantong', iconKey: 'accounts', page: PageAccounts },
    { path: 'transfer', label: 'Transfer', iconKey: 'transfer', page: PageTransfer },
    { path: 'reports', label: 'Laporan', iconKey: 'reports', page: PageReports }
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
          <div class="brand"><div class="brand-title"><span class="b-1">Buku</span><span class="b-2"> Kas</span></div><div class="brand-sub">Keuangan Rumah Tangga</div></div>\
          <ul class="nav" id="nav-list"></ul>\
          <div style="padding:0 12px"><button class="btn btn-ghost btn-sm btn-block" id="btnLogout">Keluar</button></div>\
        </aside>\
        <div class="main">\
          <div class="topbar">\
            <div><div class="topbar-greeting">Assalamualaikum' + (Store.user && Store.user.name ? ', ' + Store.user.name : '') + ' \uD83D\uDC4B</div><div class="topbar-date" id="topbar-date"></div></div>\
            <div class="topbar-avatar">' + ((Store.user && Store.user.name ? Store.user.name : 'U').trim().charAt(0).toUpperCase()) + '</div>\
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
      li.innerHTML = '<a href="#/' + r.path + '" data-path="' + r.path + '">' + Icons.nav(r.iconKey, 17) + '<span>' + r.label + '</span></a>';
      navList.appendChild(li);

      var a = document.createElement('a');
      a.href = '#/' + r.path;
      a.dataset.path = r.path;
      a.innerHTML = Icons.nav(r.iconKey, 18) + r.label.split(' ')[0];
      bottomList.appendChild(a);
    });

    document.getElementById('btnLogout').onclick = async function () {
      try { await Api.logout(); } catch (e) { /* abaikan, tetap logout di sisi klien */ }
      Api.setUser(null);
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
    Api.setUser(null);
    Store.user = null;
    window.location.hash = '#/login';
    PageLogin.render(document.body);
  }

  function boot() {
    if (!Api.getToken()) {
      goToLogin();
      return;
    }
    // Token masih ada (sesi lama) tapi Store.user di-memori sudah kosong
    // (mis. setelah refresh halaman) -- pulihkan dari localStorage supaya
    // sapaan & avatar di topbar tetap menampilkan nama yang benar.
    if (!Store.user) {
      Store.user = Api.getUser();
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
