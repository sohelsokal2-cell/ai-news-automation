export const COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return new TextEncoder().encode(secret);
}
