import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [officer, setOfficer] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (localStorage.getItem("sg_company_token")) {
          const data = await api.companyMe();
          setCompany(data.company);
        }
      } catch { localStorage.removeItem("sg_company_token"); }

      try {
        if (localStorage.getItem("sg_officer_token")) {
          const data = await api.officerMe();
          setOfficer(data.officer);
        }
      } catch { localStorage.removeItem("sg_officer_token"); }

      // The admin token has no /me endpoint to verify against (it's a
      // single hardcoded operator login, not a DB-backed account) — trust
      // it optimistically on load; any expired/invalid token will just get
      // a 401 on the first real admin API call, which adminLogout below
      // (called from the admin pages' error handling) clears.
      const adminUsername = localStorage.getItem("sg_admin_username");
      if (localStorage.getItem("sg_admin_token") && adminUsername) {
        setAdmin({ username: adminUsername });
      }

      setLoading(false);
    };
    initAuth();
  }, []);

  const companyLogin = async (email, password) => {
    const res = await fetch("/api/companies/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || "Login failed");
      err.code = data.code;
      err.email = data.email;
      throw err;
    }
    localStorage.setItem("sg_company_token", data.token);
    setCompany(data.company);
    return data.company;
  };

  const companySignup = async (name, email, password, tosAccepted) => {
    const data = await api.companySignup(name, email, password, tosAccepted);
    // Don't set company session until email is verified
    return data;
  };

  const completeRegistration = async (formData) => {
    const data = await api.companyRegister(formData);
    localStorage.setItem("sg_company_token", data.token);
    setCompany(data.company);
    return data.company;
  };

  const officerLogin = async (badge_id, password, company_id) => {
    const data = await api.officerLogin(badge_id, password, company_id);
    localStorage.setItem("sg_officer_token", data.token);
    setOfficer(data.officer);
    return data.officer;
  };

  const logoutOfficer = () => {
    localStorage.removeItem("sg_officer_token");
    setOfficer(null);
  };

  const logoutCompany = () => {
    localStorage.removeItem("sg_company_token");
    localStorage.removeItem("sg_officer_token");
    setCompany(null);
    setOfficer(null);
  };

  const adminLogin = async (username, password) => {
    const data = await api.adminLogin(username, password);
    localStorage.setItem("sg_admin_token", data.token);
    localStorage.setItem("sg_admin_username", username);
    setAdmin({ username });
    return { username };
  };

  const adminLogout = () => {
    localStorage.removeItem("sg_admin_token");
    localStorage.removeItem("sg_admin_username");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{
      company, officer, admin,
      companyLogin, companySignup, completeRegistration,
      officerLogin, logoutOfficer, logoutCompany,
      adminLogin, adminLogout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
