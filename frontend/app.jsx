/* Main App — coordinates state, role, routing */

function App() {
  // Auth state from localStorage
  const [signedIn, setSignedIn] = useState(window.API.isLoggedIn());
  const [username, setUsername] = useState(window.API.getUsername());
  const [role, setRole] = useState(window.API.getRole());

  // Hash-based simple routing for tabs
  const parseHash = () => {
    const h = window.location.hash.replace(/^#\/?/, "");
    const [path, qs] = h.split("?");
    const params = new URLSearchParams(qs || "");
    return { tab: path || "expenses", params };
  };
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const setTab = (tab) => {
    const { params } = parseHash();
    const qs = params.toString();
    window.location.hash = `#/${tab}${qs ? `?${qs}` : ""}`;
  };
  const setQuery = (key, val) => {
    const { tab, params } = parseHash();
    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
      params.delete(key);
    } else {
      params.set(key, Array.isArray(val) ? val.join("|") : val);
    }
    const qs = params.toString();
    window.location.hash = `#/${tab}${qs ? `?${qs}` : ""}`;
  };

  // Data — loaded from API
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load data on mount and when filters change
  const filters = useMemo(() => ({
    from: route.params.get("from") || "",
    to:   route.params.get("to") || "",
    cats: (route.params.get("cats") || "").split("|").filter(Boolean),
    q:    route.params.get("q") || "",
  }), [route]);

  const loadData = async () => {
    if (!signedIn) return;
    try {
      setLoading(true);
      const [exp, inc, cash] = await Promise.all([
        window.API.getExpenses(filters),
        window.API.getIncome(filters),
        window.API.getCashAccounts(),
      ]);
      setExpenses((exp || []).map(r => ({ ...r, date: r.entry_date })));
      setIncome((inc || []).map(r => ({ ...r, date: r.entry_date })));
      setCashAccounts(cash || []);
    } catch (e) {
      toast({ tone: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const filterKey = [filters.from, filters.to, filters.cats.join("|"), filters.q].join("~");
  useEffect(() => { loadData(); }, [signedIn, filterKey]);

  const setFilters = (next) => {
    setQuery("from", next.from);
    setQuery("to",   next.to);
    setQuery("cats", next.cats);
    setQuery("q",    next.q);
  };
  const resetFilters = () => setFilters({ from: "", to: "", cats: [], q: "" });

  // Apply client-side filters for rows without dates
  const applyFilters = (rows, key) => rows.filter(r => {
    if (filters.from || filters.to) {
      if (!r.date) return false;
      if (filters.from && r.date < filters.from) return false;
      if (filters.to   && r.date > filters.to)   return false;
    }
    if (filters.cats.length && !filters.cats.includes(r[key])) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!(r.description || "").toLowerCase().includes(q) &&
          !(r.notes || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Summary date filter (separate)
  const [summaryRange, setSummaryRange] = useState({});

  // Drawer state
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // CRUD — calls API then refreshes
  const upsert = async (kind, record) => {
    try {
      // Check if this is an update (has a valid numeric ID) or create (no ID)
      const isUpdate = record.id && typeof record.id === 'number';

      if (kind === "expense") {
        if (isUpdate) {
          await window.API.updateExpense(record.id, record);
        } else {
          await window.API.createExpense(record);
        }
      } else if (kind === "income") {
        if (isUpdate) {
          await window.API.updateIncome(record.id, record);
        } else {
          await window.API.createIncome(record);
        }
      } else if (kind === "cash") {
        if (isUpdate) {
          await window.API.updateCashAccount(record.id, record);
        } else {
          await window.API.createCashAccount(record);
        }
      }
      toast({ tone: "success", message: "Saved" });
      setDrawer(null);
      await loadData();
    } catch (e) {
      toast({ tone: "error", message: e.message });
    }
  };

  const remove = async (kind, id) => {
    try {
      if (kind === "expense") {
        await window.API.deleteExpense(id);
      } else if (kind === "income") {
        await window.API.deleteIncome(id);
      } else if (kind === "cash") {
        await window.API.deleteCashAccount(id);
      }
      toast({ tone: "success", message: "Deleted" });
      setConfirmDelete(null);
      setDrawer(null);
      await loadData();
    } catch (e) {
      toast({ tone: "error", message: e.message });
    }
  };

  // Login handler
  const handleLogin = async (user, pass) => {
    try {
      const data = await window.API.login(user, pass);
      setSignedIn(true);
      setUsername(data.username);
      setRole(data.role);
    } catch (e) {
      throw e;
    }
  };

  if (!signedIn) return <Login onSignIn={handleLogin}/>;

  const tab = route.tab;
  const filteredExp = applyFilters(expenses, "category");
  const filteredInc = applyFilters(income, "source");
  const expenseFiltered = filters.from || filters.to || filters.cats.length || filters.q;

  const headerForTab = {
    expenses: { title: "Expenses", subtitle: "Every shilling out of the farm" },
    income:   { title: "Income",   subtitle: "Sales and other inflows" },
    cash:     { title: "Cash", subtitle: "Money on hand across all accounts" },
    summary:  { title: "Summary",  subtitle: "Where the farm stands today" },
    readme:   { title: "Guide",    subtitle: "How to keep the books" },
  };
  const head = headerForTab[tab];

  return (
    <div className="min-h-screen bg-stone-50/60 pb-24 sm:pb-12 text-stone-900" style={{ fontFeatureSettings: '"cv11","ss01"' }}>
      <TopBar role={role} email={username} onLogout={() => window.API.logout()}/>
      <SubNav tab={tab} setTab={setTab}/>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {head && tab !== "readme" && (
          <div className="mb-4 sm:mb-5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">{head.title}</h1>
            <p className="text-sm text-stone-500 mt-0.5">{head.subtitle}</p>
          </div>
        )}

        {tab === "expenses" && (
          <div className="space-y-4">
            <FilterBar kind="expense" filters={filters} setFilters={setFilters} options={window.CATEGORIES} onReset={resetFilters}/>
            {loading ? (
              <div className="text-center py-12 text-stone-400">Loading...</div>
            ) : filteredExp.length === 0 ? (
              <EmptyState kind="expenses" filtered={expenseFiltered} role={role} onAdd={() => setDrawer({ mode: "add", kind: "expense" })} onReset={resetFilters}/>
            ) : (
              <RecordsTable
                kind="expense" rows={filteredExp} role={role}
                onEdit={(r) => setDrawer({ mode: "edit", kind: "expense", record: r })}
                onDelete={(r) => setConfirmDelete({ kind: "expense", record: r })}
                onView={(r) => setDrawer({ mode: "view", kind: "expense", record: r })}
              />
            )}
          </div>
        )}

        {tab === "income" && (
          <div className="space-y-4">
            <FilterBar kind="income" filters={filters} setFilters={setFilters} options={window.SOURCES} onReset={resetFilters}/>
            {loading ? (
              <div className="text-center py-12 text-stone-400">Loading...</div>
            ) : filteredInc.length === 0 ? (
              <EmptyState kind="income" filtered={expenseFiltered} role={role} onAdd={() => setDrawer({ mode: "add", kind: "income" })} onReset={resetFilters}/>
            ) : (
              <RecordsTable
                kind="income" rows={filteredInc} role={role}
                onEdit={(r) => setDrawer({ mode: "edit", kind: "income", record: r })}
                onDelete={(r) => setConfirmDelete({ kind: "income", record: r })}
                onView={(r) => setDrawer({ mode: "view", kind: "income", record: r })}
              />
            )}
          </div>
        )}

        {tab === "cash" && (
          <CashTab
            accounts={cashAccounts}
            loading={loading}
            role={role}
            onAdd={() => setDrawer({ mode: "add", kind: "cash" })}
            onEdit={(r) => setDrawer({ mode: "edit", kind: "cash", record: r })}
            onDelete={(r) => setConfirmDelete({ kind: "cash", record: r })}
          />
        )}

        {tab === "summary" && (
          <SummaryTab expenses={expenses} income={income} cashAccounts={cashAccounts} dateFilter={summaryRange} setDateFilter={setSummaryRange}/>
        )}

        {tab === "readme" && <ReadmeTab/>}
      </main>

      {/* FAB for admin */}
      {role === "admin" && (tab === "expenses" || tab === "income" || tab === "cash") && (
        <button
          onClick={() => setDrawer({ mode: "add", kind: tab === "expenses" ? "expense" : tab })}
          className="fixed right-4 bottom-20 sm:right-6 sm:bottom-6 z-30 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#2E7D32] text-white shadow-lg shadow-emerald-900/20 hover:bg-[#256A29] active:bg-[#1F5A23] flex items-center justify-center transition-transform hover:scale-105"
          aria-label="Add">
          <Icon.Plus className="sm:w-6 sm:h-6" width="22" height="22"/>
        </button>
      )}

      <BottomNav tab={tab} setTab={setTab}/>

      {/* Slide-over drawer */}
      <DrawerHost drawer={drawer} setDrawer={setDrawer} onSave={(r) => upsert(drawer.kind, r)} onDeleteRequest={(r) => setConfirmDelete({ kind: drawer.kind, record: r })} toast={toast}/>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-stone-900/40" onClick={() => setConfirmDelete(null)}/>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Icon.Trash width="18" height="18"/></div>
              <div>
                <h3 className="font-semibold text-stone-900">Delete this {confirmDelete.kind === "cash" ? "account" : confirmDelete.kind}?</h3>
                <p className="text-sm text-stone-600 mt-1">
                  "{confirmDelete.kind === "cash" ? confirmDelete.record.account_name : confirmDelete.record.description}" — {formatUGX(confirmDelete.kind === "cash" ? confirmDelete.record.balance : confirmDelete.record.amount)}. This can't be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => remove(confirmDelete.kind, confirmDelete.record.id)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* DrawerHost — owns formRef so the footer Save button can collect form data */
function DrawerHost({ drawer, setDrawer, onSave, onDeleteRequest, toast }) {
  const formRef = useRef(null);
  const handleSave = () => {
    const data = formRef.current && formRef.current();
    if (!data) {
      toast({ tone: "error", message: "Error: please fill in all required fields" });
      return;
    }
    onSave(data);
  };
  return (
    <Drawer
      open={!!drawer}
      onClose={() => setDrawer(null)}
      title={
        drawer?.mode === "add"  ? `Add ${drawer.kind === "cash" ? "account" : drawer.kind}` :
        drawer?.mode === "edit" ? `Edit ${drawer.kind === "cash" ? "account" : drawer.kind}` :
        drawer?.mode === "view" ? `${drawer?.kind === "expense" ? "Expense" : drawer?.kind === "income" ? "Income" : "Account"} details` : ""
      }
      footer={drawer && drawer.mode !== "view" ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setDrawer(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      ) : null}
    >
      {drawer?.mode === "view" && drawer.record && <RecordDetails kind={drawer.kind} record={drawer.record}/>}
      {drawer && drawer.mode !== "view" && drawer.kind === "cash" && (
        <CashAccountForm
          key={`cash-${drawer.record?.id || "new"}`}
          initial={drawer.record}
          formRef={formRef}
          onDeleteRequest={onDeleteRequest}
        />
      )}
      {drawer && drawer.mode !== "view" && (drawer.kind === "expense" || drawer.kind === "income") && (
        <RecordForm
          key={`${drawer.kind}-${drawer.record?.id || "new"}`}
          kind={drawer.kind}
          initial={drawer.record}
          formRef={formRef}
          onDeleteRequest={onDeleteRequest}
        />
      )}
    </Drawer>
  );
}

/* Render */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ToastHost><App/></ToastHost>);
