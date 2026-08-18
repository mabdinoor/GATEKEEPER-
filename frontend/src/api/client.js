const BASE = "/api";
function getOfficerToken() { return localStorage.getItem("sg_officer_token"); }
function getCompanyToken() { return localStorage.getItem("sg_company_token"); }
function getAdminToken() { return localStorage.getItem("sg_admin_token"); }
function authHeaders(type) {
  const t = type === "company" ? getCompanyToken() : type === "admin" ? getAdminToken() : getOfficerToken();
  return t ? { Authorization: "Bearer " + t } : {};
}

async function request(path, options, tokenType) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(tokenType || "officer"), ...(options?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) { const err = new Error(data.error || "Request failed"); err.code = data.code; throw err; }
  return data;
}

export const api = {
  // Company auth
  companySignup:   (name, email, password, tosAccepted) => request("/companies/signup", { method: "POST", body: JSON.stringify({ name, email, password, tos_accepted: tosAccepted }) }, "company"),
  companyLogin:    (email, password) => request("/companies/login", { method: "POST", body: JSON.stringify({ email, password }) }, "company"),
  companyRegister: (data) => request("/companies/register", { method: "POST", body: JSON.stringify(data) }, "company"),
  companyMe:       () => request("/companies/me", {}, "company"),

  // Officers (company admin)
  getOfficers:    () => request("/companies/officers", {}, "company"),
  addOfficer:     (data) => request("/companies/officers", { method: "POST", body: JSON.stringify(data) }, "company"),
  deleteOfficer:  (id) => request("/companies/officers/" + id, { method: "DELETE" }, "company"),

  // Officer auth
  officerLogin: (badge_id, password, company_id) => request("/auth/login", { method: "POST", body: JSON.stringify({ badge_id, password, company_id }) }),
  officerMe:    () => request("/auth/me"),

  // Visitors
  getVisitors:  (params) => request("/visitors" + (params && Object.keys(params).length ? "?" + new URLSearchParams(params) : "")),
  logVisitor:   (data) => request("/visitors", { method: "POST", body: JSON.stringify(data) }),
  checkOut:     (id) => request("/visitors/" + id + "/checkout", { method: "PATCH" }),
  getStats:     () => request("/visitors/stats"),
  getDashboard: () => request("/visitors/stats"),

  // Blacklist
  getBlacklist:    () => request("/blacklist"),
  addBlacklist:    (data) => request("/blacklist", { method: "POST", body: JSON.stringify(data) }),
  removeBlacklist: (id) => request("/blacklist/" + id, { method: "DELETE" }),
  checkBlacklist:  (params) => request("/blacklist/check?" + new URLSearchParams(params)),

  // Pre-registrations
  getPrereg:    () => request("/prereg"),
  createPrereg: (data) => request("/prereg", { method: "POST", body: JSON.stringify(data) }),
  cancelPrereg: (id) => request("/prereg/" + id + "/cancel", { method: "PATCH" }),

  // Analytics (company auth)
  getAnalytics:  (period) => request("/analytics/report?period=" + (period || "weekly"), {}, "company"),
  sendAnalytics: (period) => request("/analytics/send", { method: "POST", body: JSON.stringify({ period: period || "weekly" }) }, "company"),

  // Billing / subscriptions
  getPlans:          () => request("/billing/plans"),
  getBillingStatus:  () => request("/billing/status", {}, "company"),
  createCheckout:    (plan) => request("/billing/checkout", { method: "POST", body: JSON.stringify({ plan }) }, "company"),
  createBillingPortal: () => request("/billing/portal", { method: "POST" }, "company"),

  // Admin (platform operator, not a company/officer account)
  adminLogin:        (username, password) => request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  adminStats:        () => request("/admin/stats", {}, "admin"),
  adminListCompanies: () => request("/admin/companies", {}, "admin"),
  adminGetCompany:   (id) => request(`/admin/companies/${id}`, {}, "admin"),
  adminChangePlan:   (id, plan) => request(`/admin/companies/${id}/plan`, { method: "PATCH", body: JSON.stringify({ plan }) }, "admin"),
  adminDeleteCompany: (id) => request(`/admin/companies/${id}`, { method: "DELETE" }, "admin"),
};
