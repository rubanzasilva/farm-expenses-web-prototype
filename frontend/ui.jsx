/* Core UI primitives for Kisongi Farm Tracker.
   Styled with Tailwind utility classes. Original implementation
   inspired by the calm, neutral feel of headless component libraries. */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------------- Utilities ---------------- */
function formatUGX(n, opts = {}) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US");
  return opts.bare ? `${sign}${s}` : `${sign}${s} UGX`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function cls(...xs) { return xs.filter(Boolean).join(" "); }

/* ---------------- Icon set (lucide-style inline SVGs) ---------------- */
const Icon = {
  Plus:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  Search:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  X:       (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Edit:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
  Trash:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Eye:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  Calendar:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Filter:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/></svg>,
  Check:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  Chevron: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>,
  ArrowUp: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  ArrowDown:(p)=> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>,
  Coffee:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 2v3M10 2v3M14 2v3"/></svg>,
  User:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  TrendDown:(p)=> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 17l-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></svg>,
  TrendUp: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>,
  Wallet:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  Home:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  Pie:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M21 12A9 9 0 0 0 12 3"/></svg>,
  Book:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/></svg>,
  Mail:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m2 7 10 7 10-7"/></svg>,
  Sparkle: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  Inbox:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13a2 2 0 0 1 1.8 1.1L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6L3.7 6.1A2 2 0 0 1 5.5 5z"/></svg>,
  Leaf:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 20A7 7 0 0 1 4 13c0-7 8-9 17-8-1 9-3 17-10 15"/><path d="M2 22c2-7 6-12 14-15"/></svg>,
};

/* ---------------- Button ---------------- */
function Button({ variant = "primary", size = "md", children, className = "", ...rest }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-[15px]" };
  const variants = {
    primary: "bg-[#2E7D32] text-white shadow-sm hover:bg-[#256A29] active:bg-[#1F5A23]",
    secondary: "bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 active:bg-stone-100",
    ghost: "text-stone-700 hover:bg-stone-100 active:bg-stone-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
    gold: "bg-[#FBC02D] text-stone-900 hover:bg-[#F2B619] active:bg-[#E0A700]",
  };
  return <button className={cls(base, sizes[size], variants[variant], className)} {...rest}>{children}</button>;
}

/* ---------------- Badge ---------------- */
function Badge({ tone = "neutral", outlined = false, children, className = "" }) {
  const tones = {
    green:   outlined ? "border-[#2E7D32] text-[#2E7D32]" : "bg-[#2E7D32] text-white",
    gold:    outlined ? "border-[#FBC02D] text-[#8a6500]" : "bg-[#FBC02D] text-stone-900",
    neutral: outlined ? "border-stone-300 text-stone-700" : "bg-stone-100 text-stone-700",
    red:     outlined ? "border-rose-500 text-rose-700" : "bg-rose-100 text-rose-700",
    surface: outlined ? "border-emerald-200 text-emerald-800" : "bg-[#f1f8e9] text-emerald-800",
  };
  return (
    <span className={cls(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
      outlined && "bg-transparent border",
      tones[tone],
      className
    )}>{children}</span>
  );
}

/* ---------------- Input / Select / Textarea ---------------- */
function Input({ className = "", icon, ...rest }) {
  if (icon) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>
        <input className={cls("h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600/40", className)} {...rest} />
      </div>
    );
  }
  return <input className={cls("h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600/40", className)} {...rest} />;
}

function Select({ value, onChange, options, placeholder = "Select…", className = "" }) {
  return (
    <div className={cls("relative", className)}>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon.Chevron width="16" height="16" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"/>
    </div>
  );
}

function Textarea({ className = "", ...rest }) {
  return <textarea className={cls("min-h-[80px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30", className)} {...rest} />;
}

/* ---------------- Multi-select chip dropdown ---------------- */
function MultiSelect({ values = [], onChange, options, label = "Categories" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const toggle = (v) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="h-10 w-full inline-flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-left hover:bg-stone-50">
        <span className={cls(values.length === 0 && "text-stone-400")}>
          {values.length === 0 ? `All ${label.toLowerCase()}` : `${values.length} selected`}
        </span>
        <Icon.Chevron width="16" height="16" className="text-stone-400"/>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg p-1">
          {options.map((o) => {
            const on = values.includes(o);
            return (
              <button key={o} onClick={() => toggle(o)} className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-stone-50">
                <span>{o}</span>
                <span className={cls("flex h-4 w-4 items-center justify-center rounded border", on ? "bg-[#2E7D32] border-[#2E7D32] text-white" : "border-stone-300")}>
                  {on && <Icon.Check width="12" height="12"/>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Drawer / Slide-over ---------------- */
function Drawer({ open, onClose, title, children, footer, side = "right" }) {
  // Mobile becomes a bottom sheet (full height); desktop a side panel
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px]" onClick={onClose}/>
      <div className={cls(
        "absolute bg-white shadow-2xl flex flex-col",
        // mobile
        "inset-x-0 bottom-0 top-0 sm:top-auto sm:bottom-0 sm:inset-x-0 sm:rounded-t-2xl",
        // desktop
        "md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[440px] md:rounded-none md:rounded-l-2xl"
      )}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-stone-100 shrink-0">
          <h3 className="font-medium text-stone-900">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-stone-100 text-stone-500"><Icon.X width="18" height="18"/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-stone-100 px-5 py-3 bg-white shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
const ToastCtx = React.createContext(null);
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, ...t }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cls(
            "pointer-events-auto rounded-lg shadow-lg px-4 py-2.5 text-sm flex items-center gap-2 border",
            t.tone === "error" ? "bg-rose-600 text-white border-rose-700" :
            t.tone === "info"  ? "bg-stone-900 text-white border-stone-800" :
                                 "bg-[#2E7D32] text-white border-[#256A29]"
          )}>
            {t.tone === "error" ? <Icon.X width="16" height="16"/> : <Icon.Check width="16" height="16"/>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return React.useContext(ToastCtx); }

/* ---------------- Skeleton ---------------- */
function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      {Array.from({length: 7}).map((_, i) => (
        <td key={i} className="px-3 py-3"><div className="h-3 bg-stone-100 rounded animate-pulse"/></td>
      ))}
    </tr>
  );
}

/* ---------------- Export to window ---------------- */
Object.assign(window, {
  Button, Badge, Input, Select, Textarea, MultiSelect,
  Drawer, ToastHost, useToast, SkeletonRow, Icon,
  formatUGX, formatDate, todayISO, cls,
});
