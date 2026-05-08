/* Tables, filters, charts and main screens for Kisongi Farm Tracker. */

const PALETTE = ["#2E7D32", "#FBC02D", "#558B2F", "#8D6E63", "#0288D1", "#7B1FA2", "#C2185B", "#F57C00", "#00897B", "#5D4037", "#9E9D24"];

/* ---------------- Filter bar ---------------- */
function FilterBar({ kind, filters, setFilters, options, onReset }) {
  const isExpense = kind === "expense";
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto] gap-2 sm:gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={filters.from || ""} onChange={(e) => setFilters({ ...filters, from: e.target.value })} aria-label="From"/>
          <Input type="date" value={filters.to || ""} onChange={(e) => setFilters({ ...filters, to: e.target.value })} aria-label="To"/>
        </div>
        <MultiSelect values={filters.cats || []} onChange={(v) => setFilters({ ...filters, cats: v })} options={options} label={isExpense ? "Categories" : "Sources"}/>
        <Input icon={<Icon.Search width="16" height="16"/>} placeholder="Search description or notes…" value={filters.q || ""} onChange={(e) => setFilters({ ...filters, q: e.target.value })}/>
        <button onClick={onReset} className="text-sm text-stone-500 hover:text-[#2E7D32] underline-offset-4 hover:underline px-1 sm:justify-self-end self-center">Reset filters</button>
      </div>
    </div>
  );
}

/* ---------------- Records table ---------------- */
function RecordsTable({ kind, rows, role, onEdit, onDelete, onView, loading }) {
  const isExpense = kind === "expense";
  const labelCol = isExpense ? "Category" : "Source";
  const colKey = isExpense ? "category" : "source";

  const sorted = useMemo(() => [...rows].sort((a,b) => {
    const ad = a.date || "";
    const bd = b.date || "";
    return ad.localeCompare(bd) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }), [rows]);
  let running = 0;
  const withRunning = sorted.map(r => { running += (r.amount || 0); return { ...r, _running: running }; });
  const total = running;

  const [swipeId, setSwipeId] = useState(null);
  const swipeStart = useRef({ x: 0, id: null });
  const onTouchStart = (e, id) => {
    if (role !== "admin") return;
    swipeStart.current = { x: e.touches[0].clientX, id };
  };
  const onTouchMove = (e, id) => {
    if (role !== "admin" || swipeStart.current.id !== id) return;
    const dx = e.touches[0].clientX - swipeStart.current.x;
    if (dx < -40) setSwipeId(id);
    else if (dx > 10) setSwipeId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-stone-50/95 backdrop-blur border-b border-stone-200 text-stone-600 text-[12px] uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium w-10">#</th>
              <th className="px-3 py-2.5 text-left font-medium">Date</th>
              <th className="px-3 py-2.5 text-left font-medium">{labelCol}</th>
              <th className="px-3 py-2.5 text-left font-medium">Description</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              <th className="px-3 py-2.5 text-right font-medium">Running</th>
              <th className="px-3 py-2.5 text-left font-medium">Notes</th>
              <th className="px-3 py-2.5 text-right font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({length: 6}).map((_, i) => <SkeletonRow key={i}/>)}
            {!loading && withRunning.map((r, i) => (
              <tr key={r.id} className={cls("border-b border-stone-100 hover:bg-[#f1f8e9]/60 transition-colors group", i % 2 === 1 && "bg-stone-50/40")}>
                <td className="px-3 py-2.5 text-stone-500 tabular-nums">{i + 1}</td>
                <td className="px-3 py-2.5 text-stone-700 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-stone-700">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE[hashIdx(r[colKey])] }}/>
                    {r[colKey]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-stone-800">{r.description}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-stone-900">{formatUGX(r.amount, { bare: true })}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-stone-500">{formatUGX(r._running, { bare: true })}</td>
                <td className="px-3 py-2.5 text-stone-500 max-w-[200px] truncate" title={r.notes}>{r.notes || "—"}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {role === "admin" ? (
                      <>
                        <button onClick={() => onEdit(r)} className="h-7 w-7 inline-flex items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-[#2E7D32]" title="Edit"><Icon.Edit width="14" height="14"/></button>
                        <button onClick={() => onDelete(r)} className="h-7 w-7 inline-flex items-center justify-center rounded text-stone-500 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Icon.Trash width="14" height="14"/></button>
                      </>
                    ) : (
                      <button onClick={() => onView(r)} className="h-7 w-7 inline-flex items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-[#2E7D32]" title="View"><Icon.Eye width="14" height="14"/></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length > 0 && (
              <tr className="bg-[#f1f8e9] border-t-2 border-[#2E7D32]/20">
                <td colSpan="4" className="px-3 py-3 text-[#2E7D32] font-semibold uppercase tracking-wider text-[12px]">Total</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-[#2E7D32]">{formatUGX(total, { bare: true })}</td>
                <td colSpan="3"/>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden divide-y divide-stone-100">
        {loading && Array.from({length: 5}).map((_, i) => (
          <li key={i} className="p-3"><div className="h-3 bg-stone-100 rounded animate-pulse w-3/4 mb-2"/><div className="h-3 bg-stone-100 rounded animate-pulse w-1/2"/></li>
        ))}
        {!loading && withRunning.map((r, i) => (
          <li key={r.id} className="relative overflow-hidden">
            {role === "admin" && (
              <button onClick={() => onDelete(r)} className="absolute right-0 top-0 bottom-0 w-20 bg-rose-600 text-white flex items-center justify-center gap-1 text-sm font-medium">
                <Icon.Trash width="16" height="16"/> Delete
              </button>
            )}
            <div
              className={cls("relative bg-white px-4 py-3 transition-transform duration-200 active:bg-stone-50",
                swipeId === r.id ? "-translate-x-20" : "translate-x-0")}
              onTouchStart={(e) => onTouchStart(e, r.id)}
              onTouchMove={(e) => onTouchMove(e, r.id)}
              onTouchEnd={() => { if (swipeId !== r.id) setSwipeId(null); }}
              onClick={() => role === "admin" ? onEdit(r) : onView(r)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE[hashIdx(r[colKey])] }}/>
                    <span className="text-[12px] uppercase tracking-wider text-stone-500">{r[colKey]}</span>
                  </div>
                  <div className="text-stone-900 truncate">{r.description}</div>
                  <div className="text-[12px] text-stone-500 mt-0.5">{formatDate(r.date)}{r.notes && ` · ${r.notes}`}</div>
                </div>
                <div className="text-right font-mono tabular-nums text-stone-900 font-medium whitespace-nowrap">{formatUGX(r.amount, { bare: true })}</div>
              </div>
            </div>
          </li>
        ))}
        {!loading && rows.length > 0 && (
          <li className="bg-[#f1f8e9] px-4 py-3 flex items-center justify-between">
            <span className="text-[#2E7D32] font-semibold uppercase tracking-wider text-[12px]">Total</span>
            <span className="font-mono tabular-nums font-bold text-[#2E7D32]">{formatUGX(total, { bare: true })}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function hashIdx(s) {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETTE.length;
}

/* ---------------- Empty states ---------------- */
function EmptyState({ kind, filtered, role, onAdd, onReset }) {
  if (filtered) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-stone-300 p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
          <Icon.Search width="22" height="22"/>
        </div>
        <p className="text-stone-700 font-medium">No {kind} match your filters.</p>
        <button onClick={onReset} className="mt-2 text-sm text-[#2E7D32] hover:underline">Reset filters</button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-dashed border-stone-300 p-10 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-[#f1f8e9] flex items-center justify-center text-[#2E7D32] mb-3">
        <Icon.Leaf width="28" height="28"/>
      </div>
      <p className="text-stone-800 font-medium">No {kind} yet.</p>
      <p className="text-sm text-stone-500 mt-1">
        {role === "admin"
          ? `Tap "Add ${kind === "expenses" ? "expense" : "income"}" to log your first one.`
          : "Ask the admin to add the first entry."}
      </p>
      {role === "admin" && (
        <Button variant="primary" className="mt-4" onClick={onAdd}>
          <Icon.Plus width="16" height="16"/> Add {kind === "expenses" ? "expense" : "income"}
        </Button>
      )}
    </div>
  );
}

/* ---------------- Add / Edit form (controlled by parent via formRef) ---------------- */
function RecordForm({ kind, initial, formRef, onDeleteRequest }) {
  const isExpense = kind === "expense";
  const [date, setDate] = useState(initial?.date || todayISO());
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.[isExpense ? "category" : "source"] || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const options = isExpense ? window.CATEGORIES : window.SOURCES;

  // Expose collect() to parent via ref
  useEffect(() => {
    if (!formRef) return;
    formRef.current = () => {
      if (!date || !description || !category || amount === "") return null;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) return null;
      const result = {
        date,
        amount: numAmount,
        description,
        [isExpense ? "category" : "source"]: category,
        notes,
      };
      // Only include id if editing an existing record
      if (initial?.id) {
        result.id = initial.id;
      }
      return result;
    };
  }, [date, amount, description, category, notes, initial, isExpense, formRef]);

  const suggestion = useMemo(() => {
    if (!isExpense || !description || category) return null;
    const d = description.toLowerCase();
    const map = [
      ["transport", "Transport"], ["taxi", "Transport"], ["fuel", "Transport"],
      ["lunch", "Meals"], ["meal", "Meals"], ["breakfast", "Meals"], ["food", "Meals"],
      ["seedling", "Seedlings"], ["sucker", "Seedlings"],
      ["hoe", "Tools"], ["panga", "Tools"], ["tool", "Tools"],
      ["dig", "Land Preparation"], ["tractor", "Land Preparation"], ["land", "Land Preparation"],
      ["chairman", "Community/Admin"], ["lc", "Community/Admin"],
      ["agronomist", "Labor"], ["labor", "Labor"], ["worker", "Labor"],
      ["padlock", "Supplies"], ["supplies", "Supplies"], ["string", "Supplies"], ["measure", "Supplies"],
      ["boot", "PPE/Equipment"], ["glove", "PPE/Equipment"],
      ["goodwill", "Goodwill"],
    ];
    for (const [k, v] of map) if (d.includes(k)) return v;
    return null;
  }, [description, category, isExpense]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1"/>
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Amount (UGX)</label>
        <input
          type="number" inputMode="numeric" min="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="mt-1 h-14 w-full rounded-lg border border-stone-200 bg-white px-3 text-2xl font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600/40"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isExpense ? "e.g. Transport to Kisongi" : "e.g. Sale of trees"} className="mt-1"/>
        {suggestion && (
          <button onClick={() => setCategory(suggestion)} className="mt-2 inline-flex items-center gap-1.5 text-[12px] bg-[#f1f8e9] text-[#2E7D32] hover:bg-[#e6f3d8] rounded-full px-2.5 py-1 border border-emerald-200">
            <Icon.Sparkle width="12" height="12"/> Suggested: <span className="font-medium">{suggestion}</span>
          </button>
        )}
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">{isExpense ? "Category" : "Source"}</label>
        <Select value={category} onChange={setCategory} options={options} placeholder={`Select ${isExpense ? "category" : "source"}…`} className="mt-1"/>
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Notes <span className="text-stone-400 normal-case font-normal">(optional)</span></label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering" className="mt-1"/>
      </div>
      {initial && onDeleteRequest && (
        <button onClick={() => onDeleteRequest(initial)} className="text-sm text-rose-600 hover:text-rose-700 hover:underline">Delete this {kind}</button>
      )}
    </div>
  );
}

/* ---------------- Details viewer ---------------- */
function RecordDetails({ kind, record }) {
  const isExpense = kind === "expense";
  const colKey = isExpense ? "category" : "source";
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#f1f8e9] p-5">
        <div className="text-[12px] uppercase tracking-wider text-emerald-800/70">Amount</div>
        <div className="mt-1 text-3xl font-mono tabular-nums text-[#2E7D32] font-semibold">{formatUGX(record.amount, { bare: true })} <span className="text-base text-stone-500 font-sans">UGX</span></div>
      </div>
      <Field label="Date" value={formatDate(record.date)}/>
      <Field label={isExpense ? "Category" : "Source"} value={
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE[hashIdx(record[colKey])] }}/>
          {record[colKey]}
        </span>
      }/>
      <Field label="Description" value={record.description}/>
      <Field label="Notes" value={record.notes || "—"}/>
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div>
      <div className="text-[12px] uppercase tracking-wider text-stone-500">{label}</div>
      <div className="mt-1 text-stone-800">{value}</div>
    </div>
  );
}

Object.assign(window, { FilterBar, RecordsTable, EmptyState, RecordForm, RecordDetails, PALETTE, hashIdx });
