/**
 * icons.js
 * Ikon SVG inline (24x24, stroke currentColor) -- tanpa dependency/CDN luar.
 * Warna ikon otomatis ikut warna teks di sekitarnya (currentColor).
 */
var Icons = (function () {
  function svg(inner, size) {
    size = size || 16;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:-3px">' + inner + '</svg>';
  }

  var NAV = {
    dashboard: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
    income: '<circle cx="12" cy="12" r="9"/><path d="M12 16V8M8 11l4-4 4 4"/>',
    expense: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 13l4 4 4-4"/>',
    budget: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8 11h8M8 15h5"/>',
    investment: '<path d="M12 3l4 5h-3v10h-2V8H8z"/><path d="M6 21h12"/>',
    debtReceivable: '<path d="M7 8h10M7 8l3-3M7 8l3 3"/><path d="M17 16H7M17 16l-3-3M17 16l-3 3"/>',
    accounts: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14" r="1.4"/>',
    transfer: '<path d="M4 7h13M17 7l-3-3M17 7l-3 3"/><path d="M20 17H7M7 17l3-3M7 17l3 3"/>',
    reports: '<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2 20h20"/>',
    infaq: '<path d="M12 21s-7-4.5-9-8.5C1.5 8 3 5 6 5c2 0 3 1 3 1s1-1 3-1c3 0 4.5 3 3 6.5C19 16.5 12 21 12 21z"/><path d="M12 8v5M9.5 10.5h5"/>'
  };

  var CATEGORY = {
    groceries: '<path d="M6 8h12l-1.5 11a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    jajan: '<circle cx="12" cy="12" r="8"/><path d="M9 10c.5-1 1.5-1 2 0M13 10c.5-1 1.5-1 2 0"/><path d="M8.5 14a4 4 0 0 0 7 0"/>',
    transportasi: '<path d="M4 16V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><path d="M4 16h16v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/>',
    rumahTangga: '<path d="M4 11l8-6 8 6"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-5h4v5"/>',
    tagihan: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    belanja: '<path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    kesehatan: '<path d="M20.8 8.6c0 5-8.8 10.4-8.8 10.4S3.2 13.6 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8z"/><path d="M9 11h2.5l1-2 1.5 4 1-2H17"/>',
    pendidikan: '<path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/>',
    sosial: '<path d="M12 20s-7-4.5-9-8.5C1.5 8 3 5 6 5c2 0 3 1 3 1s1-1 3-1c3 0 4.5 3 3 6.5C13 15.5 12 20 12 20z"/>',
    hiburan: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 9l6 3-6 3z"/>',
    bisnis: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    lain: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>',
    gaji: '<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3"/>',
    investasi: '<path d="M4 18l5-6 4 3 6-8"/><path d="M15 6h4v4"/>',
    hadiah: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 9h16v3H4z"/><path d="M12 9v11"/><path d="M12 9C9 9 8.5 5 11 5s1 4-1 4zM12 9c3 0 3.5-4 1-4s-1 4 1 4z"/>'
  };

  var MISC = {
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    trash: '<path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13h8l1-13"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14" r="1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'
  };

  function categoryKeyFor_(name) {
    var n = (name || '').toLowerCase();
    if (n.indexOf('groc') !== -1 || n.indexOf('makan') !== -1) return 'groceries';
    if (n.indexOf('jajan') !== -1) return 'jajan';
    if (n.indexOf('transport') !== -1 || n.indexOf('fuel') !== -1 || n.indexOf('parkir') !== -1 || n.indexOf('parking') !== -1) return 'transportasi';
    if (n.indexOf('rumah tangga') !== -1) return 'rumahTangga';
    if (n.indexOf('tagihan') !== -1 || n.indexOf('utilitas') !== -1 || n.indexOf('listrik') !== -1 || n.indexOf('internet') !== -1) return 'tagihan';
    if (n.indexOf('belanja') !== -1 || n.indexOf('gaya hidup') !== -1 || n.indexOf('shop') !== -1) return 'belanja';
    if (n.indexOf('kesehatan') !== -1 || n.indexOf('health') !== -1) return 'kesehatan';
    if (n.indexOf('pendidikan') !== -1 || n.indexOf('education') !== -1) return 'pendidikan';
    if (n.indexOf('sosial') !== -1 || n.indexOf('donasi') !== -1 || n.indexOf('sedekah') !== -1 || n.indexOf('infaq') !== -1) return 'sosial';
    if (n.indexOf('hiburan') !== -1 || n.indexOf('entertain') !== -1) return 'hiburan';
    if (n.indexOf('bisnis') !== -1 || n.indexOf('business') !== -1) return 'bisnis';
    if (n.indexOf('gaji') !== -1 || n.indexOf('bonus') !== -1 || n.indexOf('usaha') !== -1) return 'gaji';
    if (n.indexOf('investasi') !== -1 || n.indexOf('investment') !== -1) return 'investasi';
    if (n.indexOf('hadiah') !== -1 || n.indexOf('gift') !== -1) return 'hadiah';
    return 'lain';
  }

  return {
    nav: function (key, size) { return svg(NAV[key] || NAV.dashboard, size); },
    category: function (name, size) { return svg(CATEGORY[categoryKeyFor_(name)], size); },
    misc: function (key, size) { return svg(MISC[key] || MISC.filter, size); }
  };
})();
