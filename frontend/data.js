// API client — replaces hardcoded seed data.
// Auth token stored in localStorage.

window.CATEGORIES = [
  "Transport", "PPE/Equipment", "Meals", "Land Preparation",
  "Community/Admin", "Supplies", "Goodwill", "Seedlings",
  "Tools", "Labor", "Other",
];

window.SOURCES = [
  "Tree Sales", "Coffee Sales", "Seedling Sales", "Timber",
  "Rental", "Grant / Support", "Other",
];

window.API = {
  getToken() {
    return localStorage.getItem("kisongi_token");
  },

  setAuth(token, role, username) {
    localStorage.setItem("kisongi_token", token);
    localStorage.setItem("kisongi_role", role);
    localStorage.setItem("kisongi_username", username);
  },

  clearAuth() {
    localStorage.removeItem("kisongi_token");
    localStorage.removeItem("kisongi_role");
    localStorage.removeItem("kisongi_username");
  },

  getRole() {
    return localStorage.getItem("kisongi_role") || "viewer";
  },

  getUsername() {
    return localStorage.getItem("kisongi_username") || "";
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  async _fetch(path, options = {}) {
    const token = this.getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(path, { ...options, headers });
    if (res.status === 401) {
      this.clearAuth();
      window.location.reload();
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    if (res.status === 204) return null;
    return res.json();
  },

  async login(username, password) {
    const data = await this._fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setAuth(data.token, data.role, data.username);
    return data;
  },

  logout() {
    this.clearAuth();
    window.location.reload();
  },

  async getExpenses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.cats && filters.cats.length) params.set("category", filters.cats.join("|"));
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    return this._fetch(`/api/expenses${qs ? `?${qs}` : ""}`);
  },

  async createExpense(data) {
    return this._fetch("/api/expenses", {
      method: "POST",
      body: JSON.stringify({
        entry_date: data.date || null,
        category: data.category,
        description: data.description,
        amount: data.amount,
        notes: data.notes || "",
      }),
    });
  },

  async updateExpense(id, data) {
    return this._fetch(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        entry_date: data.date || null,
        category: data.category,
        description: data.description,
        amount: data.amount,
        notes: data.notes || "",
      }),
    });
  },

  async deleteExpense(id) {
    return this._fetch(`/api/expenses/${id}`, { method: "DELETE" });
  },

  async getIncome(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.cats && filters.cats.length) params.set("source", filters.cats.join("|"));
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    return this._fetch(`/api/income${qs ? `?${qs}` : ""}`);
  },

  async createIncome(data) {
    return this._fetch("/api/income", {
      method: "POST",
      body: JSON.stringify({
        entry_date: data.date || null,
        source: data.source,
        description: data.description,
        amount: data.amount,
        notes: data.notes || "",
      }),
    });
  },

  async updateIncome(id, data) {
    return this._fetch(`/api/income/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        entry_date: data.date || null,
        source: data.source,
        description: data.description,
        amount: data.amount,
        notes: data.notes || "",
      }),
    });
  },

  async deleteIncome(id) {
    return this._fetch(`/api/income/${id}`, { method: "DELETE" });
  },

  async getSummary() {
    return this._fetch("/api/summary");
  },

  async classify(text, kind) {
    const data = await this._fetch("/api/classify", {
      method: "POST",
      body: JSON.stringify({ text, kind }),
    });
    return data.suggestion;
  },
};
