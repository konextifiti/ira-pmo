import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is PMO/ADMIN/SUPERADMIN
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_groups!inner(name, permissions)")
      .eq("email", user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const record = userData as Record<string, unknown>
    const groups = record.user_groups
    const group = (Array.isArray(groups) ? groups[0] : groups) as { name: string; permissions: any }
    const tier = group.permissions?.tier

    if (!["PMO", "ADMIN", "SUPERADMIN"].includes(tier)) {
      return NextResponse.json({ error: "Forbidden — insufficient permissions" }, { status: 403 })
    }

    const { id, rejectionReason } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    // Fetch current site record
    const { data: site } = await supabase
      .from("project_sites")
      .select("*")
      .eq("id", id)
      .single()

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    if (site.approval_status === "pending") {
      // New site: reject it
      const { error: updateError } = await supabase
        .from("project_sites")
        .update({
          approval_status: "rejected",
          rejection_reason: rejectionReason.trim(),
          approved_by: record.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else if (site.pending_changes) {
      // Change request: clear pending_changes, keep approved status, record reason
      const { error: updateError } = await supabase
        .from("project_sites")
        .update({
          pending_changes: null,
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Site has no pending changes" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
