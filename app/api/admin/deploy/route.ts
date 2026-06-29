import { NextResponse } from "next/server";

export async function POST() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return NextResponse.json({ ok: true, note: "No VERCEL_DEPLOY_HOOK_URL set — skipped" });
  }
  const res = await fetch(hookUrl, { method: "POST" });
  if (!res.ok) {
    return NextResponse.json({ error: "Deploy hook failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
