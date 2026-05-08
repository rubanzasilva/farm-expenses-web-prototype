/* Cash accounts management */

function CashTab({ accounts, loading, role, onAdd, onEdit, onDelete }) {
  if (loading) {
    return <div className="text-center py-12 text-stone-400">Loading...</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <Icon.Wallet width="28" height="28" className="text-stone-400"/>
        </div>
        <h3 className="text-lg font-medium text-stone-900 mb-1">No cash accounts yet</h3>
        <p className="text-sm text-stone-500 mb-5">Track your balances across bank, mobile money, and cash</p>
        {role === "admin" && (
          <Button variant="primary" onClick={onAdd}>
            <Icon.Plus width="16" height="16"/> Add account
          </Button>
        )}
      </div>
    );
  }

  // Group accounts by type
  const byType = {};
  accounts.forEach(acc => {
    if (!byType[acc.account_type]) byType[acc.account_type] = [];
    byType[acc.account_type].push(acc);
  });

  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Total card */}
      <div className="rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1F5A23] p-6 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-1">Total Cash on Hand</div>
        <div className="text-4xl font-mono font-semibold tabular-nums">{formatUGX(totalCash, { bare: true })}</div>
        <div className="text-sm opacity-75 mt-0.5">UGX</div>
      </div>

      {/* Accounts by type */}
      {Object.keys(byType).map(type => (
        <div key={type}>
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">{type}</h3>
          <div className="space-y-2">
            {byType[type].map(acc => (
              <div key={acc.id} className="bg-white rounded-lg border border-stone-200 p-4 flex items-center justify-between hover:border-stone-300 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-stone-900">{acc.account_name}</div>
                  {acc.notes && <div className="text-sm text-stone-500 mt-0.5">{acc.notes}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-mono font-semibold text-stone-900 tabular-nums">{formatUGX(acc.balance, { bare: true })}</div>
                    <div className="text-xs text-stone-500">UGX</div>
                  </div>
                  {role === "admin" && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(acc)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-stone-100 text-stone-600">
                        <Icon.Edit width="16" height="16"/>
                      </button>
                      <button onClick={() => onDelete(acc)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-rose-50 text-rose-600">
                        <Icon.Trash width="16" height="16"/>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Cash account form */
function CashAccountForm({ initial, formRef, onDeleteRequest }) {
  const [accountType, setAccountType] = useState(initial?.account_type || "");
  const [accountName, setAccountName] = useState(initial?.account_name || "");
  const [balance, setBalance] = useState(initial?.balance?.toString() || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  // Format amount with commas for display
  const formatAmountDisplay = (val) => {
    if (!val) return "";
    const num = val.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(num)) return val;
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleBalanceChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setBalance(raw);
    }
  };

  // Expose collect() to parent via ref
  useEffect(() => {
    if (!formRef) return;
    formRef.current = () => {
      if (!accountType || !accountName || balance === "") return null;
      const numBalance = parseFloat(balance);
      if (isNaN(numBalance)) return null;
      const result = {
        account_type: accountType,
        account_name: accountName,
        balance: numBalance,
        notes,
      };
      if (initial?.id) {
        result.id = initial.id;
      }
      return result;
    };
  }, [accountType, accountName, balance, notes, initial, formRef]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Account Type</label>
        <Select value={accountType} onChange={setAccountType} options={window.ACCOUNT_TYPES} placeholder="Select account type…" className="mt-1"/>
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Account Name</label>
        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Centenary Bank, MTN Mobile Money" className="mt-1"/>
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Balance (UGX)</label>
        <input
          type="text" inputMode="numeric"
          value={formatAmountDisplay(balance)}
          onChange={handleBalanceChange}
          placeholder="0"
          className="mt-1 h-14 w-full rounded-lg border border-stone-200 bg-white px-3 text-2xl font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600/40"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-stone-600 uppercase tracking-wider">Notes <span className="text-stone-400 normal-case font-normal">(optional)</span></label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Account number, branch, etc." className="mt-1"/>
      </div>
      {initial && onDeleteRequest && (
        <button onClick={() => onDeleteRequest(initial)} className="text-sm text-rose-600 hover:text-rose-700 hover:underline">Delete this account</button>
      )}
    </div>
  );
}

Object.assign(window, { CashTab, CashAccountForm });
