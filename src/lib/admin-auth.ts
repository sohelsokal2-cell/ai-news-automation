import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { COOKIE_NAME, SESSION_MAX_AGE, getSessionSecret } from "@/lib/session-secret";

export async function login(username: string, password: string): Promise<boolean> {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash) return false;
  if (username !== adminUser) return false;

  return bcrypt.compare(password, adminHash);
}

export async function createSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

export async function getSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;

    await jwtVerify(token, getSessionSecret());
    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
