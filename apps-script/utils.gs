/**
 * utils.gs
 */

function successResponse_(data, message) {
  return jsonOutput_({ success: true, data: data, message: message || 'Success' });
}

function errorResponse_(message, code) {
  return jsonOutput_({ success: false, data: null, message: message, code: code || 'ERROR' });
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() {
  return new Date().toISOString();
}

/** Terima string 'yyyy-MM-dd' atau Date, kembalikan {month, year} */
function extractMonthYear_(dateInput) {
  var d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function isSameMonth_(dateInput, month, year) {
  var my = extractMonthYear_(dateInput);
  return my.month === Number(month) && my.year === Number(year);
}

function toNumber_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function sumBy_(rows, field) {
  return rows.reduce(function (acc, r) { return acc + toNumber_(r[field]); }, 0);
}

function logAudit_(userId, action, entity, entityId, oldValue, newValue) {
  insertRow(SHEET_NAMES.AUDIT_LOGS, {
    logId: generateId('AUDIT_LOGS'),
    userId: userId,
    action: action,
    entity: entity,
    entityId: entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : '',
    newValue: newValue ? JSON.stringify(newValue) : '',
    timestamp: nowIso_()
  });
}
