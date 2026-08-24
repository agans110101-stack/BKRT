/**
 * dbHelper.gs
 * Layer akses database (Google Sheet). SEMUA service HARUS lewat sini,
 * jangan panggil SpreadsheetApp langsung di service.
 *
 * Prinsip performa: selalu getValues()/setValues() batch, jangan getRange()
 * per-cell di dalam loop.
 */

function getSheet(sheetName) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new AppError_('SHEET_NOT_FOUND', 'Sheet ' + sheetName + ' tidak ditemukan. Jalankan setupDatabase() dulu.');
  }
  return sheet;
}

/**
 * Ambil seluruh baris sebuah sheet sebagai array of object (key = header).
 * Menyertakan _row (nomor baris asli di sheet, 1-indexed) untuk keperluan update/delete.
 */
function getAllRows(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var headers = SHEET_HEADERS[sheetName];
  if (lastRow < 2) return [];

  var range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  var values = range.getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var obj = rowToObject_(headers, values[i]);
    obj._row = i + 2;
    rows.push(obj);
  }
  return rows;
}

function rowToObject_(headers, rowValues) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = rowValues[i];
  }
  return obj;
}

function findById(sheetName, idField, id) {
  var rows = getAllRows(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idField]) === String(id)) return rows[i];
  }
  return null;
}

/**
 * filters: object sederhana { field: value }. Mendukung juga
 * { field: { op: 'gte'|'lte'|'in', value: ... } } untuk filter tanggal/range.
 */
function findRows(sheetName, filters) {
  var rows = getAllRows(sheetName);
  if (!filters) return rows;

  return rows.filter(function (row) {
    for (var key in filters) {
      var cond = filters[key];
      if (cond && typeof cond === 'object' && 'op' in cond) {
        var rowVal = row[key];
        if (cond.op === 'gte' && !(rowVal >= cond.value)) return false;
        if (cond.op === 'lte' && !(rowVal <= cond.value)) return false;
        if (cond.op === 'in' && cond.value.indexOf(rowVal) === -1) return false;
      } else {
        if (String(row[key]) !== String(cond)) return false;
      }
    }
    return true;
  });
}

function insertRow(sheetName, data) {
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName];
  var rowValues = headers.map(function (h) {
    return data.hasOwnProperty(h) ? data[h] : '';
  });
  sheet.appendRow(rowValues);
  return data;
}

/** Insert banyak baris sekaligus (batch) - dipakai untuk transfer/ledger. */
function insertRows(sheetName, dataArray) {
  if (!dataArray.length) return;
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName];
  var values = dataArray.map(function (data) {
    return headers.map(function (h) {
      return data.hasOwnProperty(h) ? data[h] : '';
    });
  });
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, values.length, headers.length).setValues(values);
}

function updateRow(sheetName, idField, id, patch) {
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName];
  var existing = findById(sheetName, idField, id);
  if (!existing) {
    throw new AppError_('NOT_FOUND', 'Data dengan ' + idField + '=' + id + ' tidak ditemukan di ' + sheetName);
  }
  var merged = {};
  headers.forEach(function (h) { merged[h] = existing.hasOwnProperty(h) ? existing[h] : ''; });
  for (var key in patch) { merged[key] = patch[key]; }

  var rowValues = headers.map(function (h) { return merged[h]; });
  sheet.getRange(existing._row, 1, 1, headers.length).setValues([rowValues]);
  return merged;
}

/**
 * Kita TIDAK menyediakan hard delete untuk data finansial (lihat aturan #31).
 * Fungsi ini hanya dipakai untuk data non-finansial (mis. kategori yang belum
 * pernah dipakai transaksi apapun).
 */
function hardDeleteRow(sheetName, idField, id) {
  var sheet = getSheet(sheetName);
  var existing = findById(sheetName, idField, id);
  if (!existing) return false;
  sheet.deleteRow(existing._row);
  return true;
}

function AppError_(code, message) {
  var err = new Error(message);
  err.code = code;
  return err;
}
