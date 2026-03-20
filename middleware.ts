import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({ request: req });
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: use getUser() not getSession() for security
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to login if unauthenticated
  if (!user && req.nextUrl.pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes — check role from JWT claims
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const role = user.app_metadata?.user_role;
    if (!role || !["hr_manager", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/chat", req.url));
    }
  }

  // API routes — return 401 if unauthenticated
  if (!user && req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: { message: "Μη εξουσιοδοτημένη πρόσβαση" } },
      { status: 401 },
    );
  }

  return res;
}

export const config = {
  matcher: ["/chat/:path*", "/admin/:path*", "/api/:path*"],
};
