import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, getSessionSecret } from "@/lib/session-secret";

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSessionSecret());
    return true;
  } catch {
    return false;
  }
}

// Next.js 16 renamed the Middleware convention to Proxy (proxy.ts) and expects
// the file next to `app` (i.e. src/proxy.ts when using a src directory).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login") && !pathname.startsWith("/api/admin/logout");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(request);

  if (!authed) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};