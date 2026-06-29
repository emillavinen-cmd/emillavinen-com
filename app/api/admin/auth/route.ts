
import { createHash } from "crypto";
import * as OTPAuth from "otpauth";
import { NextRequest, NextResponse } from "next/server";

function sha256Hex(text: string): string {
  return createHash("shex");
}

function sessionToken(password: string): string {
  return sha256Hex(pass
}

export async function POST(request: NextRequest) {
  const body = await re
  const { password, totp } = body as { password?: string; totp?: string };

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponseD not configured" }, {status: 500 });
  }

  if (password !== proc
    return NextResponse.json({ error: "Incorrect password." }, { status: 401
});
  }

  // If no TOTP_SECRET configured, skip 2FA (backwards compatible)
  if (!process.env.TOTP
    const response = NextResponse.json({ ok: true });
    response.cookies.seen(password), {
      httpOnly: true,
      secure: process.e
      sameSite: "strict",
      maxAge: 60 * 60 *
      path: "/",
    });
    return response;
  }

  // Password correct — it
  if (!totp) {
    return NextResponse
  }

  // Verify the TOTP code
  const totpObj = new O
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.SecTP_SECRET),
  });

  const delta = totpObj.validate({ token: totp, window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Incorrect authenticator code." }, {
status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set((password), {
    httpOnly: true,
    secure: process.env
    sameSite: "strict",
    maxAge: 60 * 60 * 2
    path: "/",
  });
  return response;
}

export async function D
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ly: true, maxAge: 0,path: "/" });
  return response;
}

---
Step 5 — Update app/adm

Replace the entire file

"use client";

import { useState } fro
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRou
  const [password, setPassword] = useState("");
  const [totp, setTotp]
  const [step, setStep] = useState<"password" | "totp">("password");
  const [error, setErro
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = step =: { password, totp };

    const res = await f
      method: "POST",
      headers: { "Conte},
      body: JSON.stringify(body),
    });

    const data = await

    if (res.ok) {
      if (data.step === "totp") {
        setStep("totp")
        setLoading(false);
        return;
      }
      router.push("/adm
      router.refresh();
      return;
    }

    setError(
      res.status === 50
        ? "Server error: ADMIN_PASSWORD is not configured."
        : data.error ??
    );
    setLoading(false);
  }

  return (
    <div className="minustify-centerbg-neutral-50">
      <div className="wr border-neutral-200rounded-lg p-8">
        <h1 className="in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "pa
            <div>
              <label cledium text-neutral-500uppercase tracking-widest mb-2">
                Passwor
              </label>
              <input
                type="password"
                value={
                onChange={(e) => setPassword(e.target.value)}
                autoFoc
                required
                classNaral-300 rounded px-3py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          ) : (
            <div>
              <label cledium text-neutral-500uppercase tracking-widest mb-2">
                Authent
              </label>
              <input
                type="text"
                inputMo
                pattern="[0-9]{6}"
                maxLeng
                value={totp}
                onChanglue.replace(/\D/g, ""))}
                autoFocus
                require
                placeholder="000000"
                classNaral-300 rounded px-3py-2 text-sm focus:outline-none focus:border-black tracking-widest
text-center font-mono"
              />
              <p classN mt-2 text-center">
                6-digit code from your authenticator app
              </p>
            </div>
          )}

          {error && <p 00">{error}</p>}

          <button
            type="submit"
            disabled={l
            className="w-full py-2 text-sm bg-black text-white rounded
hover:bg-neutral-800 di
          >
            {loading ? ord" ? "Continue" :"Sign in"}
          </button>

          {step === "to
            <button
              type="but
              onClick={() => { setStep("password"); setTotp("");
setError(""); }}
              className="w-full py-2 text-sm text-neutral-400
hover:text-black"
            >
              ← Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
}