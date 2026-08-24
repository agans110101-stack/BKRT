/**
 * charts.js
 * Wrapper tipis di atas Chart.js supaya semua chart konsisten dengan tema.
 */
var Charts = (function () {
  var palette = {
    brass: '#219EBC',
    green: '#1E8A58',
    red: '#C0392B',
    grid: 'rgba(2,48,71,0.08)',
    text: '#5B7A8C'
  };

  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = palette.text;

  function barIncomeExpense(canvas, buckets) {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: buckets.map(function (b) { return b.label; }),
        datasets: [
          { label: 'Income', data: buckets.map(function (b) { return b.income; }), backgroundColor: palette.green, borderRadius: 3 },
          { label: 'Expense', data: buckets.map(function (b) { return b.expense; }), backgroundColor: palette.red, borderRadius: 3 }
        ]
      },
      options: baseOptions_()
    });
  }

  function pieCategory(canvas, rows) {
    var colors = [palette.brass, '#FFB703', palette.green, '#FB8500', '#023047', '#8ECAE6', palette.red, '#5B7A8C', '#17748A', '#0B4162', '#B8860B'];
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: rows.map(function (r) { return r.category; }),
        datasets: [{ data: rows.map(function (r) { return r.total; }), backgroundColor: colors, borderColor: '#FFFFFF', borderWidth: 2 }]
      },
      options: { plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { family: "'IBM Plex Sans', sans-serif", size: 11 }, color: palette.text } } }, maintainAspectRatio: false }
    });
  }

  function barBalance(canvas, rows) {
    return new Chart(canvas, {
      type: 'bar',
      data: { labels: rows.map(function (r) { return r.account; }), datasets: [{ data: rows.map(function (r) { return r.balance; }), backgroundColor: palette.brass, borderRadius: 3 }] },
      options: Object.assign(baseOptions_(), { indexAxis: 'y', plugins: { legend: { display: false } } })
    });
  }

  function lineSeries(canvas, buckets, field, color) {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: buckets.map(function (b) { return b.label; }),
        datasets: [{ data: buckets.map(function (b) { return b[field]; }), borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.3, pointRadius: 2 }]
      },
      options: Object.assign(baseOptions_(), { plugins: { legend: { display: false } } })
    });
  }

  function baseOptions_() {
    return {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: palette.grid }, ticks: { font: { family: "'IBM Plex Sans', sans-serif" } } },
        y: { grid: { color: palette.grid }, ticks: { font: { family: "'IBM Plex Sans', sans-serif" } } }
      },
      plugins: { legend: { labels: { font: { family: "'IBM Plex Sans', sans-serif" }, boxWidth: 10 } } }
    };
  }

  return { barIncomeExpense: barIncomeExpense, pieCategory: pieCategory, barBalance: barBalance, lineSeries: lineSeries, palette: palette };
})();
