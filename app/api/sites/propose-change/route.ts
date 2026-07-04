import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { validateSubmission } from "@/lib/approvals/validate"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { siteId, status, notes } = await request.json()

    if (!siteId || !status) {
      return NextResponse.json({ error: "siteId and status are required" }, { status: 400 })
    }

    // Resolve user id from public.users via email
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Run placeholder validation
    const validation = validateSubmission({ siteId, status, notes })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors?.join(", ") }, { status: 400 })
    }

    // Build pending_changes object with what's being changed
    const pendingChanges: Record<string, any> = { status }

    // Get current site to see if status actually differs
    const { data: site } = await supabase
      .from("project_sites")
      .select("status")
      .eq("id", siteId)
      .single()

    if (site && site.status === status) {
      return NextResponse.json({ error: "No changes to submit — status is the same" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("project_sites")
      .update({
        pending_changes: pendingChanges,
        submitted_by: userData.id,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", siteId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
