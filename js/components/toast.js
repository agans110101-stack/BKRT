/**
 * toast.js
 */
var Toast = (function () {
  function ensureRoot() {
    var root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function show(message, type) {
    var root = ensureRoot();
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.2s ease';
      setTimeout(function () { el.remove(); }, 200);
    }, 3200);
  }

  return {
    success: function (msg) { show(msg, 'success'); },
    error: function (msg) { show(msg, 'error'); },
    info: function (msg) { show(msg, ''); }
  };
})();
