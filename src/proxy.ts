import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const protectedPage = (pathname: string) =>
  pathname === "/dashboard" ||
  (pathname.startsWith("/dashboard/") && pathname !== "/dashboard/my-higher-study") ||
  pathname === "/projects/submit";

export async function proxy(request: NextRequest) {
  if (!protectedPage(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/submit"],
};
