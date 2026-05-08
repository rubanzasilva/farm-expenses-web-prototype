/* Summary tab — KPIs, charts, breakdown tables */

const { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
        BarChart, Bar, XAxis, YAxis, CartesianGrid } = Recharts;

function KpiTile({ label, value, tone = "neutral", icon, sub }) {
  const tones = {
    neutral: "bg-white border-stone-200",
    green: "bg-[#f1f8e9] border-emerald-200",
    gold: "bg-amber-50 border-amber-200",
    red: "bg-rose-50 border-rose-200",
  };
  const valueTone = {
    neutral: "text-stone-900",
    green: "text-[#2E7D32]",
    gold: "text-amber-800",
    red: "text-rose-700",
  };
  return (
    <div className={cls("rounded-xl border p-4 sm:p-5", tones[tone])}>
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-wider text-stone-600">{label}</div>
        <div className="text-stone-400">{icon}</div>
      </div>
      <div className={cls("mt-2 text-2xl sm:text-3xl font-semibold font-mono tabular-nums", valueTone[tone])}>{value}</div>
      {sub && <div className="mt-1 text-[12px] text-stone-500">{sub}</div>}
    </div>
  );
}

function SummaryTab({ expenses, income, cashAccounts = [], dateFilter, setDateFilter }) {
  // Apply date filter. Undated rows are included when no filter is set, excluded otherwise.
  const inRange = (iso) => {
    if (!dateFilter.from && !dateFilter.to) return true;
    if (!iso) return false;
    if (dateFilter.from && iso < dateFilter.from) return false;
    if (dateFilter.to && iso > dateFilter.to) return false;
    return true;
  };
  const exp = expenses.filter(e => inRange(e.date));
  const inc = income.filter(i => inRange(i.date));

  const totalExp = exp.reduce((s, x) => s + (x.amount || 0), 0);
  const totalInc = inc.reduce((s, x) => s + (x.amount || 0), 0);
  const net = totalInc - totalExp;

  // Calculate all-time net for cash discrepancy (unfiltered)
  const totalExpAll = expenses.reduce((s, x) => s + (x.amount || 0), 0);
  const totalIncAll = income.reduce((s, x) => s + (x.amount || 0), 0);
  const netAll = totalIncAll - totalExpAll;

  const totalCash = cashAccounts.reduce((s, acc) => s + (acc.balance || 0), 0);
  const discrepancy = totalCash - netAll;

  // Expense by category
  const byCat = useMemo(() => {
    const map = new Map();
    for (const e of exp) {
      const k = e.category || "Other";
      const cur = map.get(k) || { name: k, total: 0, count: 0 };
      cur.total += e.amount || 0;
      cur.count += 1;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [exp]);

  // Income by source
  const bySrc = useMemo(() => {
    const map = new Map();
    for (const e of inc) {
      const k = e.source || "Other";
      const cur = map.get(k) || { name: k, total: 0, count: 0 };
      cur.total += e.amount || 0;
      cur.count += 1;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [inc]);

  // Monthly grouped. Undated rows go into a "No date" bucket.
  const monthly = useMemo(() => {
    const map = new Map();
    const add = (iso, key, val) => {
      const m = iso ? iso.slice(0, 7) : "0000-00";
      const cur = map.get(m) || { month: m, expenses: 0, income: 0 };
      cur[key] += val || 0;
      map.set(m, cur);
    };
    exp.forEach(e => add(e.date, "expenses", e.amount));
    inc.forEach(i => add(i.date, "income", i.amount));
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).map(x => ({
      ...x,
      label: x.month === "0000-00"
        ? "No date"
        : new Date(x.month + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" })
    }));
  }, [exp, inc]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date filter */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="text-[12px] uppercase tracking-wider text-stone-500 font-medium">Date range</div>
        <div className="flex gap-2 flex-1">
          <Input type="date" value={dateFilter.from || ""} onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}/>
          <Input type="date" value={dateFilter.to || ""} onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}/>
        </div>
        <button onClick={() => setDateFilter({})} className="text-sm text-stone-500 hover:text-[#2E7D32] hover:underline whitespace-nowrap">Clear</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile label="Total Income" value={formatUGX(totalInc, { bare: true })} sub={`${inc.length} ${inc.length === 1 ? "entry" : "entries"} · UGX`} tone="gold" icon={<Icon.TrendUp width="18" height="18"/>}/>
        <KpiTile label="Total Expenses" value={formatUGX(totalExp, { bare: true })} sub={`${exp.length} ${exp.length === 1 ? "entry" : "entries"} · UGX`} tone="green" icon={<Icon.TrendDown width="18" height="18"/>}/>
        <KpiTile label="Net Position" value={formatUGX(net, { bare: true })} sub={net < 0 ? "Operating at a loss · UGX" : "In the black · UGX"} tone={net < 0 ? "red" : "green"} icon={<Icon.Wallet width="18" height="18"/>}/>
        <KpiTile label="Cash on Hand" value={formatUGX(totalCash, { bare: true })} sub={discrepancy !== 0 ? `${formatUGX(Math.abs(discrepancy), { bare: true })} ${discrepancy > 0 ? "over" : "under"} · UGX` : "Matches net · UGX"} tone={discrepancy === 0 ? "green" : "neutral"} icon={<Icon.Wallet width="18" height="18"/>}/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Expenses by category" subtitle={`${byCat.length} ${byCat.length === 1 ? "category" : "categories"}`}>
          {byCat.length === 0 ? <ChartEmpty/> : (
            <div style={{ height: Math.max(180, byCat.length * 34 + 24) }}>
              <ResponsiveContainer>
                <BarChart data={byCat} layout="vertical" margin={{ top: 4, right: 96, bottom: 4, left: 8 }} barCategoryGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false}/>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#78716c" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e7e5e4" }}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#44403c" }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={(v) => formatUGX(v)}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }}
                    cursor={{ fill: "#f1f8e9" }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}
                       label={{
                         position: "right",
                         fontSize: 11,
                         fill: "#57534e",
                         formatter: (v) => totalExp ? `${(v / totalExp * 100).toFixed(1)}%` : "",
                       }}>
                    {byCat.map((c) => <Cell key={c.name} fill={PALETTE[hashIdx(c.name)]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly income vs expenses" subtitle={monthly.length ? `${monthly.length} ${monthly.length === 1 ? "month" : "months"}` : ""}>
          {monthly.length === 0 ? <ChartEmpty/> : (
            <div className="h-[260px]">
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false}/>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={{ stroke: "#e7e5e4" }}/>
                  <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                  <Tooltip formatter={(v) => formatUGX(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }} cursor={{ fill: "#f1f8e9" }}/>
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>
                  <Bar dataKey="income" fill="#FBC02D" radius={[4,4,0,0]} maxBarSize={40}/>
                  <Bar dataKey="expenses" fill="#2E7D32" radius={[4,4,0,0]} maxBarSize={40}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <BreakdownTable title="Expenses by category" rows={byCat} total={totalExp} colorKey/>
        <BreakdownTable title="Income by source" rows={bySrc} total={totalInc} colorKey/>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-medium text-stone-900">{title}</h3>
        {subtitle && <span className="text-[12px] text-stone-500">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="h-[220px] flex items-center justify-center text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-lg">
      No data in this range
    </div>
  );
}

function BreakdownTable({ title, rows, total, colorKey }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-stone-100">
        <h3 className="font-medium text-stone-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-sm text-stone-400">No entries</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead className="bg-stone-50/50 text-stone-600 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{title.includes("category") ? "Category" : "Source"}</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
              <th className="px-4 py-2 text-right font-medium w-16"># entries</th>
              <th className="px-4 py-2 text-right font-medium w-20">% of total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = total ? (r.total / total * 100) : 0;
              return (
                <tr key={r.name} className="border-t border-stone-100 hover:bg-stone-50/50">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      {colorKey && <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[hashIdx(r.name)] }}/>}
                      <span className="text-stone-800">{r.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-stone-900">{formatUGX(r.total, { bare: true })}</td>
                  <td className="px-4 py-2.5 text-right text-stone-500 tabular-nums">{r.count}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2E7D32]" style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="font-mono tabular-nums text-stone-600 text-[12px] w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-[#f1f8e9] border-t-2 border-[#2E7D32]/20">
              <td className="px-4 py-2.5 text-[#2E7D32] font-semibold uppercase tracking-wider text-[11px]">Total</td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums font-bold text-[#2E7D32]">{formatUGX(total, { bare: true })}</td>
              <td colSpan="2"></td>
            </tr>
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SummaryTab, KpiTile });
