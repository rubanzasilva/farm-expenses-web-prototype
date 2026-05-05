/* App shell — top bar, tabs, login screen, README, and main coordination */

function Login({ onSignIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      await onSignIn(username, password);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f1f8e9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#2E7D32] flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
            <Icon.Coffee width="26" height="26"/>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900 tracking-tight">Kisongi Farm Tracker</h1>
          <p className="text-sm text-stone-600 mt-1">Robusta coffee · Uganda</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm">
          {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Username</label>
            <Input type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" icon={<Icon.User width="16" height="16"/>}/>
          </div>
          <div>
            <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Password</label>
            <Input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1"/>
          </div>
          <Button variant="primary" size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-[12px] text-stone-500 mt-4 text-center">Read-only access? Ask the admin for viewer credentials.</p>
      </div>
    </div>
  );
}

/* ---------------- README tab ---------------- */
function ReadmeTab() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-stone-200 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1 text-[12px] uppercase tracking-wider text-[#2E7D32] font-medium">
        <Icon.Book width="14" height="14"/> Usage notes
      </div>
      <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">How to use this tracker</h2>
      <p className="text-stone-600 mt-2 leading-relaxed">A quick guide to logging expenses and income for the Kisongi farm. All figures are in Ugandan Shillings (UGX).</p>

      <ol className="mt-6 space-y-4">
        {[
          ["Log every expense as it happens", "Open the Expenses tab, tap “Add expense”, fill in the date, amount, what it was for, and pick a category. Notes are optional but useful for receipts and counts."],
          ["Use Income for everything that comes in", "Tree sales during land opening, future coffee sales, seedling sales, rental, grants. Pick the right Source so the Summary stays accurate."],
          ["Filter to slice your view", "Date range and category filters live in the URL — share a link to a specific filtered view with your accountant."],
          ["Read the Summary tab regularly", "Three KPIs (Income, Expenses, Net Position) plus charts and breakdown tables. The Net Position turns red if expenses exceed income."],
          ["Roles", "Admin can add, edit, delete. Viewer (accountant, partner, agronomist) is read-only — they can browse, filter and see the same Summary."],
        ].map(([t, body], i) => (
          <li key={i} className="flex gap-4">
            <div className="shrink-0 h-7 w-7 rounded-full bg-[#f1f8e9] text-[#2E7D32] font-mono font-semibold text-sm flex items-center justify-center">{i + 1}</div>
            <div>
              <div className="font-medium text-stone-900">{t}</div>
              <p className="text-sm text-stone-600 mt-0.5 leading-relaxed">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 pt-6 border-t border-stone-100">
        <div className="text-[12px] uppercase tracking-wider text-stone-500 font-medium mb-2">Categories in use</div>
        <div className="flex flex-wrap gap-1.5">
          {window.CATEGORIES.map(c => (
            <Badge key={c} tone="surface" outlined>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE[hashIdx(c)] }}/>{c}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-[#f1f8e9] p-4 text-sm text-emerald-900 border border-emerald-100">
        <div className="font-medium mb-1">Tip: keep receipts</div>
        Snap a photo of every receipt and reference it in the Notes field (e.g. “receipt #042”). Makes audits and reconciliation painless.
      </div>
    </div>
  );
}

/* ---------------- Top bar ---------------- */
function TopBar({ role, email, onLogout }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center">
            <Icon.Coffee width="18" height="18"/>
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-stone-900 tracking-tight">Kisongi Farm</div>
            <div className="text-[11px] text-stone-500 -mt-0.5 hidden sm:block">Tracker · Robusta</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="green" outlined={role !== "admin"}>{role === "admin" ? "Admin" : "Viewer"}</Badge>
          <div ref={ref} className="relative">
            <button onClick={() => setMenu(o => !o)} className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600">
              <Icon.User width="18" height="18"/>
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-60 rounded-lg border border-stone-200 bg-white shadow-lg p-1 text-sm">
                <div className="px-3 py-2 border-b border-stone-100">
                  <div className="font-medium text-stone-900 truncate">{email}</div>
                  <div className="text-[12px] text-stone-500">Signed in as {role}</div>
                </div>
                <button onClick={() => { if (onLogout) onLogout(); setMenu(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-stone-50 text-rose-600">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Tabs ---------------- */
function SubNav({ tab, setTab }) {
  const tabs = [
    { id: "expenses", label: "Expenses", icon: <Icon.TrendDown width="16" height="16"/> },
    { id: "income",   label: "Income",   icon: <Icon.TrendUp   width="16" height="16"/> },
    { id: "summary",  label: "Summary",  icon: <Icon.Pie       width="16" height="16"/> },
    { id: "readme",   label: "README",   icon: <Icon.Book      width="16" height="16"/> },
  ];
  return (
    <nav className="hidden sm:block sticky top-14 z-30 bg-white/85 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 h-12">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cls(
            "inline-flex items-center gap-2 h-10 px-3.5 text-sm rounded-lg transition-colors",
            tab === t.id ? "text-[#2E7D32] bg-[#f1f8e9]" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
          )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "expenses", label: "Expenses", icon: <Icon.TrendDown width="20" height="20"/> },
    { id: "income",   label: "Income",   icon: <Icon.TrendUp   width="20" height="20"/> },
    { id: "summary",  label: "Summary",  icon: <Icon.Pie       width="20" height="20"/> },
    { id: "readme",   label: "Guide",    icon: <Icon.Book      width="20" height="20"/> },
  ];
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-14">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cls(
            "inline-flex flex-col items-center justify-center gap-0.5 text-[10px] uppercase tracking-wider transition-colors",
            tab === t.id ? "text-[#2E7D32]" : "text-stone-500"
          )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

Object.assign(window, { Login, ReadmeTab, TopBar, SubNav, BottomNav });
