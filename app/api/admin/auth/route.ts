import { createHash } from "crypto";
import * as OTPAuth from "otpauth";
import { NextRequest, NextResponse } from "next/server";

function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function sessionToken(password: string): string {
  return sha256Hex(password + "admin-session");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password, totp } = body as { password?: string; totp?: string };

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not configured" }, { status: 500 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  if (!process.env.TOTP_SECRET) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", sessionToken(password), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  }

  if (!totp) {
    return NextResponse.json({ step: "totp" });
  }

  const totpObj = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(process.env.TOTP_SECRET),
  });

  const delta = totpObj.validate({ token: totp, window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Incorrect authenticator code." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", sessionToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
