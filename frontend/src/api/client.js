const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
function getOfficerToken() { return localStorage.getItem("sg_officer_token"); }
function getCompanyToken() { return localStorage.getItem("sg_company_token"); }
function getAdminToken() { return localStorage.getItem("sg_admin_token"); }
function authHeaders(type) {
  const t = type === "company" ? getCompanyToken() : type === "admin" ? getAdminToken() : getOfficerToken();
  return t ? { Authorization: "Bearer " + t } : {};
}

export async function apiRequest(path, options, tokenType) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(tokenType || "officer"), ...(options?.headers || {}) },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || "Request failed");
    err.code = data && data.code;
    throw err;
  }

  return data;
}

const request = apiRequest;

export const api = {
  // Company auth
  companySignup:   (name, email, password, tosAccepted) => apiRequest("/companies/signup", { method: "POST", body: JSON.stringify({ name, email, password, tos_accepted: tosAccepted }) }, "company"),
  companyLogin:    (email, password) => apiRequest("/companies/login", { method: "POST", body: JSON.stringify({ email, password }) }, "company"),
  companyRegister: (data) => apiRequest("/companies/register", { method: "POST", body: JSON.stringify(data) }, "company"),
  companyMe:       () => apiRequest("/companies/me", {}, "company"),

  // Officers (company admin)
  getOfficers:    () => apiRequest("/companies/officers", {}, "company"),
  addOfficer:     (data) => apiRequest("/companies/officers", { method: "POST", body: JSON.stringify(data) }, "company"),
  deleteOfficer:  (id) => apiRequest("/companies/officers/" + id, { method: "DELETE" }, "company"),

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
