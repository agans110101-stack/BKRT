/**
 * modal.js
 * Drawer generik (slide-up di mobile, center modal di desktop).
 */
var Modal = (function () {
  var overlayEl = null;

  function open(title, contentEl, opts) {
    close();
    opts = opts || {};
    overlayEl = document.createElement('div');
    overlayEl.className = 'overlay';

    var drawer = document.createElement('div');
    drawer.className = 'drawer';

    var header = document.createElement('div');
    header.className = 'drawer-header';
    var h = document.createElement('h2');
    h.textContent = title;
    var closeBtn = document.createElement('button');
    closeBtn.className = 'drawer-close';
    closeBtn.setAttribute('aria-label', 'Tutup');
    closeBtn.textContent = '\u00d7';
    closeBtn.onclick = close;
    header.appendChild(h);
    header.appendChild(closeBtn);

    drawer.appendChild(header);
    drawer.appendChild(contentEl);
    overlayEl.appendChild(drawer);
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl && !opts.persistent) close();
    });

    requestAnimationFrame(function () { overlayEl.classList.add('open'); });
    return overlayEl;
  }

  function close() {
    if (!overlayEl) return;
    overlayEl.classList.remove('open');
    var el = overlayEl;
    overlayEl = null;
    setTimeout(function () { el.remove(); }, 200);
  }

  return { open: open, close: close };
})();
