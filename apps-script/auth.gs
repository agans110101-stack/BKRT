/**
 * auth.gs
 * Login internal aplikasi (BUKAN akun Google). Username + password disimpan
 * ter-hash (SHA-256 + salt per user) di sheet USERS.
 *
 * Session token disimpan di CacheService (bukan PropertiesService) supaya
 * otomatis expired dan tidak numpuk data lama.
 */

function hashPassword_(password, salt) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + ':' + salt,
    Utilities.Charset.UTF_8
  );
  return raw.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function generateToken_() {
  return Utilities.getUuid() + Utilities.getUuid();
}

/**
 * Dipanggil sekali via editor Apps Script untuk membuat akun pertama.
 * JANGAN dipanggil lewat Web App endpoint publik.
 */
function createUser(name, username, plainPassword, role) {
  var existing = findRows(SHEET_NAMES.USERS, { username: username });
  if (existing.length > 0) {
    throw new AppError_('USERNAME_TAKEN', 'Username sudah dipakai.');
  }
  var salt = generateSalt_();
  var hash = hashPassword_(plainPassword, salt);
  var user = {
    userId: generateId('USERS'),
    name: name,
    username: username,
    passwordHash: hash,
    passwordSalt: salt,
    role: role || 'OWNER',
    isActive: true,
    createdAt: nowIso_(),
    updatedAt: nowIso_()
  };
  insertRow(SHEET_NAMES.USERS, user);
  return { userId: user.userId, name: user.name, username: user.username };
}

function login(username, plainPassword) {
  requireFields_({ username: username, plainPassword: plainPassword }, ['username', 'plainPassword']);
  var user = findRows(SHEET_NAMES.USERS, { username: username })[0];
  if (!user || user.isActive === false || user.isActive === 'FALSE') {
    throw new AppError_('INVALID_CREDENTIALS', 'Username atau password salah.');
  }
  var hash = hashPassword_(plainPassword, user.passwordSalt);
  if (hash !== user.passwordHash) {
    throw new AppError_('INVALID_CREDENTIALS', 'Username atau password salah.');
  }

  var token = generateToken_();
  CacheService.getScriptCache().put('session_' + token, user.userId, SESSION_DURATION_SECONDS);

  logAudit_(user.userId, 'LOGIN', 'USERS', user.userId, null, null);

  return { token: token, userId: user.userId, name: user.name, role: user.role };
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove('session_' + token);
  return { loggedOut: true };
}

/** Kembalikan userId jika token valid, lempar error jika tidak. */
function requireAuth_(token) {
  if (!token) throw new AppError_('UNAUTHORIZED', 'Sesi tidak ditemukan. Silakan login kembali.');
  var userId = CacheService.getScriptCache().get('session_' + token);
  if (!userId) throw new AppError_('SESSION_EXPIRED', 'Sesi kamu sudah habis. Silakan login kembali.');
  // Perpanjang sesi setiap ada aktivitas (sliding expiration).
  CacheService.getScriptCache().put('session_' + token, userId, SESSION_DURATION_SECONDS);
  return userId;
}
