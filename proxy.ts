import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"
import { MODULE_REGISTRY } from "@/lib/permissions/moduleRegistry"

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  if (pathname === "/login" || pathname === "/") return supabaseResponse

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_groups!inner(permissions)")
    .eq("id", user.id)
    .single()

  const groups = (userData as any)?.user_groups
  if (!groups) return supabaseResponse

  const group = Array.isArray(groups) ? groups[0] : groups
  const permissions = (group as any).permissions
  if (!permissions?.modules) return supabaseResponse

  const denied = MODULE_REGISTRY.some((m) => {
    if (pathname === m.route) {
      return permissions.modules[m.key]?.access !== true
    }
    if (m.key === "site_detail" && pathname.startsWith("/sites/")) {
      return permissions.modules["site_detail"]?.access !== true
    }
    return false
  })

  if (denied) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
