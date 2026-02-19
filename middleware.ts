import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    console.error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local and restart the dev server."
    )
    return response
  }

  const supabase = createServerClient(
    supabaseUrl.trim(),
    supabaseAnonKey.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup"

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
