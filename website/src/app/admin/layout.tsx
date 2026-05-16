"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { Lock } from "lucide-react";

const AuthCtx = createContext<string>("");
export const useAdminPassword = () => useContext(AuthCtx);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [input, setInput]       = useState("");
  const [error, setError]       = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pw") ?? "";
    setPassword(saved);
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/products?page=1", {
      headers: { "x-admin-password": input },
    });
    if (res.ok) {
      sessionStorage.setItem("admin_pw", input);
      setPassword(input);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!password) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Lock size={32} className="mx-auto text-white/20 mb-4" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">Admin Panel</h1>
            <p className="text-white/30 text-xs mt-2 tracking-widest uppercase">DROPSHOP</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs">Incorrect password.</p>}
            <button type="submit" className="w-full btn-primary justify-center">
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AuthCtx.Provider value={password}>{children}</AuthCtx.Provider>;
}
