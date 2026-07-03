"use client"

import { Bell, LogOut, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/lib/permissions/usePermissions"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const { user } = usePermissions()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[#1E3A5F] bg-[#0D1B2A] px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-[#64748B] hover:text-white hover:bg-[#1E3A5F] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {user && (
          <span className="hidden sm:inline-flex h-5 items-center rounded-full bg-[#1E3A5F] px-2 text-[10px] font-medium text-[#64748B]">
            {user.groupName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10B981]" />
          </span>
          <span className="text-xs font-medium text-[#10B981]">Live</span>
        </div>

        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#1E3A5F]/50 transition-colors"
        >
          <Bell className="w-4 h-4 text-[#64748B]" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-white px-1">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[#64748B] hover:text-white hover:bg-[#1E3A5F]/50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
