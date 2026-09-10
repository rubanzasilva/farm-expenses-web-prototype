// Print-to-PDF report generation.
// Opens a new window with a self-contained, print-styled HTML document and
// triggers the browser print dialog (user chooses "Save as PDF"). No deps.
// Works on desktop and mobile.

(function () {
  function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    const sign = n < 0 ? "−" : "";
    return sign + Math.abs(n).toLocaleString("en-US");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function rangeLabel(range) {
    if (!range || (!range.from && !range.to)) return "All time";
    const from = range.from ? fmtDate(range.from) : "start";
    const to = range.to ? fmtDate(range.to) : "today";
    return `${from} — ${to}`;
  }

  // Shared <head> styles for the printable document.
  const STYLES = `
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
           color: #1c1917; margin: 0; font-size: 12px; }
    h1 { font-size: 20px; margin: 0 0 2px; }
    h2 { font-size: 14px; margin: 22px 0 8px; padding-bottom: 4px;
         border-bottom: 2px solid #2E7D32; color: #2E7D32; }
    .meta { color: #78716c; font-size: 11px; margin-bottom: 16px; }
    .kpis { display: flex; gap: 10px; margin: 14px 0 4px; flex-wrap: wrap; }
    .kpi { flex: 1; min-width: 120px; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 12px; }
    .kpi .label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #78716c; }
    .kpi .value { font-size: 18px; font-weight: 600; margin-top: 4px;
                  font-variant-numeric: tabular-nums; }
    .pos { color: #2E7D32; } .neg { color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { padding: 6px 8px; text-align: left; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: .04em;
         color: #57534e; border-bottom: 1px solid #d6d3d1; }
    td { border-bottom: 1px solid #f0efed; font-variant-numeric: tabular-nums; }
    td.num, th.num { text-align: right; }
    tr.total td { font-weight: 700; border-top: 2px solid #2E7D32; color: #2E7D32; border-bottom: none; }
    tbody tr:nth-child(even) td { background: #fafaf9; }
    .foot { margin-top: 24px; font-size: 10px; color: #a8a29e; text-align: center; }
    @media print { .noprint { display: none; } }
  `;

  function openPrintWindow(title, bodyHtml) {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Pop-up blocked. Please allow pop-ups for this site to print/save PDF.");
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>${esc(title)}</title><style>${STYLES}</style></head>
      <body>${bodyHtml}
      <div class="noprint" style="text-align:center;margin:20px 0;">
        <button onclick="window.print()" style="padding:8px 18px;font-size:13px;border:1px solid #2E7D32;
          background:#2E7D32;color:#fff;border-radius:8px;cursor:pointer;">Print / Save as PDF</button>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>
      </body></html>`);
    w.document.close();
  }

  // Build category/source breakdown from a flat list.
  function breakdown(rows, keyField) {
    const map = new Map();
    let total = 0;
    for (const r of rows) {
      const k = r[keyField] || "Other";
      const cur = map.get(k) || { name: k, total: 0, count: 0 };
      cur.total += r.amount || 0;
      cur.count += 1;
      total += r.amount || 0;
      map.set(k, cur);
    }
    return { rows: [...map.values()].sort((a, b) => b.total - a.total), total };
  }

  function inRange(iso, range) {
    if (!range || (!range.from && !range.to)) return true;
    if (!iso) return false;
    if (range.from && iso < range.from) return false;
    if (range.to && iso > range.to) return false;
    return true;
  }

  // --- Public: summary report PDF ---
  function printSummaryReport({ expenses, income, cashAccounts, range }) {
    const exp = expenses.filter((e) => inRange(e.date, range));
    const inc = income.filter((i) => inRange(i.date, range));
    const totalExp = exp.reduce((s, x) => s + (x.amount || 0), 0);
    const totalInc = inc.reduce((s, x) => s + (x.amount || 0), 0);
    const net = totalInc - totalExp;
    const totalCash = (cashAccounts || []).reduce((s, a) => s + (a.balance || 0), 0);

    const byCat = breakdown(exp, "category");
    const bySrc = breakdown(inc, "source");

    const breakdownTable = (title, bd, keyHead) => {
      if (!bd.rows.length) return `<h2>${esc(title)}</h2><p style="color:#a8a29e">No entries in this range.</p>`;
      const body = bd.rows.map((r) => {
        const pct = bd.total ? (r.total / bd.total * 100).toFixed(1) : "0.0";
        return `<tr><td>${esc(r.name)}</td><td class="num">${fmt(r.total)}</td>
                <td class="num">${r.count}</td><td class="num">${pct}%</td></tr>`;
      }).join("");
      const entries = bd.rows.reduce((s, r) => s + (r.count || 0), 0);
      return `<h2>${esc(title)}</h2><table>
        <thead><tr><th>${esc(keyHead)}</th><th class="num">Total (UGX)</th>
          <th class="num">Entries</th><th class="num">% of total</th></tr></thead>
        <tbody>${body}
          <tr class="total"><td>Total</td><td class="num">${fmt(bd.total)}</td>
            <td class="num">${entries || ""}</td><td></td></tr>
        </tbody></table>`;
    };

    const body = `
      <h1>Kisongi Farm — Financial Summary</h1>
      <div class="meta">Period: ${esc(rangeLabel(range))} · Generated ${fmtDate(new Date().toISOString().slice(0,10))}</div>
      <div class="kpis">
        <div class="kpi"><div class="label">Total Income</div><div class="value pos">${fmt(totalInc)}</div></div>
        <div class="kpi"><div class="label">Total Expenses</div><div class="value">${fmt(totalExp)}</div></div>
        <div class="kpi"><div class="label">Net Position</div><div class="value ${net < 0 ? "neg" : "pos"}">${fmt(net)}</div></div>
        <div class="kpi"><div class="label">Cash on Hand</div><div class="value">${fmt(totalCash)}</div></div>
      </div>
      ${breakdownTable("Expenses by category", byCat, "Category")}
      ${breakdownTable("Income by source", bySrc, "Source")}
      <div class="foot">Kisongi Farm Tracker · All amounts in UGX</div>`;

    openPrintWindow("Farm Summary Report", body);
  }

  // --- Public: raw data tables PDF ---
  function printDataTables({ expenses, income, range }) {
    const exp = expenses.filter((e) => inRange(e.date, range));
    const inc = income.filter((i) => inRange(i.date, range));

    const expBody = exp.length
      ? exp.map((e) => `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.category)}</td>
          <td>${esc(e.description)}</td><td class="num">${fmt(e.amount)}</td><td>${esc(e.notes)}</td></tr>`).join("")
      : `<tr><td colspan="5" style="color:#a8a29e">No expenses in this range.</td></tr>`;
    const expTotal = exp.reduce((s, x) => s + (x.amount || 0), 0);

    const incBody = inc.length
      ? inc.map((i) => `<tr><td>${fmtDate(i.date)}</td><td>${esc(i.source)}</td>
          <td>${esc(i.description)}</td><td class="num">${fmt(i.amount)}</td><td>${esc(i.notes)}</td></tr>`).join("")
      : `<tr><td colspan="5" style="color:#a8a29e">No income in this range.</td></tr>`;
    const incTotal = inc.reduce((s, x) => s + (x.amount || 0), 0);

    const body = `
      <h1>Kisongi Farm — Data Tables</h1>
      <div class="meta">Period: ${esc(rangeLabel(range))} · Generated ${fmtDate(new Date().toISOString().slice(0,10))}</div>
      <h2>Expenses (${exp.length})</h2>
      <table><thead><tr><th>Date</th><th>Category</th><th>Description</th>
        <th class="num">Amount</th><th>Notes</th></tr></thead>
        <tbody>${expBody}<tr class="total"><td colspan="3">Total</td>
          <td class="num">${fmt(expTotal)}</td><td></td></tr></tbody></table>
      <h2>Income (${inc.length})</h2>
      <table><thead><tr><th>Date</th><th>Source</th><th>Description</th>
        <th class="num">Amount</th><th>Notes</th></tr></thead>
        <tbody>${incBody}<tr class="total"><td colspan="3">Total</td>
          <td class="num">${fmt(incTotal)}</td><td></td></tr></tbody></table>
      <div class="foot">Kisongi Farm Tracker · All amounts in UGX</div>`;

    openPrintWindow("Farm Data Tables", body);
  }

  window.PrintReport = { printSummaryReport, printDataTables };
})();
