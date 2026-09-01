/**
 * login.js
 */
var PageLogin = {
  render(root) {
    document.body.classList.add('is-login');
    root.innerHTML = '';
    var shell = document.createElement('div');
    shell.className = 'login-shell';
    shell.innerHTML = '\
      <div class="login-card">\
        <div class="login-brand">\
          <div class="login-brand-title"><span class="b-1">Buku</span> Kas</div>\
          <div class="login-brand-sub">Keuangan Rumah Tangga</div>\
        </div>\
        <form id="login-form">\
          <div class="field"><label>Username</label><input type="text" name="username" required autofocus></div>\
          <div class="field"><label>Password</label><input type="password" name="password" required></div>\
          <div class="field-error" id="login-error" style="display:none"></div>\
          <button class="btn btn-primary btn-block" type="submit">Masuk</button>\
        </form>\
      </div>';
    document.body.innerHTML = '';
    document.body.appendChild(shell);

    shell.querySelector('#login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var errEl = shell.querySelector('#login-error');
      errEl.style.display = 'none';
      var fd = new FormData(e.target);
      try {
        var res = await Api.login(fd.get('username'), fd.get('password'));
        Api.setToken(res.token);
        Store.user = { userId: res.userId, name: res.name, role: res.role };
        document.body.classList.remove('is-login');
        window.location.hash = '#/dashboard';
        Router.boot();
      } catch (err) {
        errEl.textContent = err.message || 'Login gagal.';
        errEl.style.display = 'block';
      }
    });
  }
};
