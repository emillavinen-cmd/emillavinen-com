"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<"password" | "totp">("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = step === "password" ? { password } : { password, totp };

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      if (data.step === "totp") {
        setStep("totp");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
      return;
    }

    setError(
      res.status === 500
        ? "Server error: ADMIN_PASSWORD is not configured."
        : data.error ?? "Something went wrong."
    );
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-8">
        <h1 className="text-lg font-medium mb-6">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "password" ? (
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
                Authenticator code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                autoFocus
                required
                placeholder="000000"
                className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black tracking-widest text-center font-mono"
              />
              <p className="text-xs text-neutral-400 mt-2 text-center">
                6-digit code from your authenticator app
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Checking…" : step === "password" ? "Continue" : "Sign in"}
          </button>

          {step === "totp" && (
            <button
              type="button"
              onClick={() => { setStep("password"); setTotp(""); setError(""); }}
              className="w-full py-2 text-sm text-neutral-400 hover:text-black"
            >
              ← Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
