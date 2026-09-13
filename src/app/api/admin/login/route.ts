import { NextResponse } from "next/server";
import { login, createSession, setSessionCookie } from "@/lib/admin-auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: Request): Promise<NextResponse> {
  const key = clientKey(request);
  const { allowed, retryAfterSec } = checkRateLimit(`login:${key}`);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  let valid: boolean;
  try {
    valid = await login(username, password);
  } catch {
    return NextResponse.json({ error: "Auth configuration error" }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession();
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
