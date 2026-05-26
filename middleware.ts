import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = "/dashboard";
const LOGIN     = "/login";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith(PROTECTED)) return NextResponse.next();

  // Token pode estar em cookie (futuro) ou a gente apenas checa ausência de cookie de sessão.
  // Como o token fica no localStorage (client-only), o middleware não consegue lê-lo —
  // mas consegue verificar um cookie que a gente seta no login.
  const token = req.cookies.get("wayvo_session")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
