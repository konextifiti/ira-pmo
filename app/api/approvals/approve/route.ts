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

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
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

    const now = new Date().toISOString()

    if (site.approval_status === "pending") {
      // New site: approve it
      const { error: updateError } = await supabase
        .from("project_sites")
        .update({
          approval_status: "approved",
          approved_by: record.id,
          approved_at: now,
        })
        .eq("id", id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else if (site.pending_changes) {
      // Change request: apply pending_changes to actual columns
      const changes = site.pending_changes as Record<string, any>
      const updateData: Record<string, any> = {
        pending_changes: null,
        approved_by: record.id,
        approved_at: now,
      }

      // Apply each pending change to the actual column
      for (const [key, value] of Object.entries(changes)) {
        if (key === "status") {
          updateData.status = value
        }
      }

      const { error: updateError } = await supabase
        .from("project_sites")
        .update(updateData)
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
