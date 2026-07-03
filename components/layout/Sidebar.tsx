"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Radio,
  ShieldHalf,
  Bot,
  FileText,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tracker", label: "BTS Tracker", icon: Radio },
  {
    href: "/spv",
    label: "SPV Queue",
    icon: ShieldHalf,
    badge: true,
  },
  { href: "/agents", label: "Agent Monitor", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileText },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-[220px] flex-col border-r border-[#1E3A5F] bg-[#0D1B2A] transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + X */}
        <div className="flex items-center justify-between gap-2 px-5 h-14 border-b border-[#1E3A5F] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4D4] to-[#7c3aed] text-white text-xs font-bold">
              AI
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              AI·PMO
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-[#64748B] hover:text-white hover:bg-[#1E3A5F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-[#1E3A5F] text-white border-l-[3px] border-[#00D4D4] rounded-l-none"
                  : "text-[#64748B] hover:text-white hover:bg-[#1E3A5F]/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-[#7c3aed] text-[10px] font-bold text-white px-1.5">
                  NEW
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Project chip */}
      <div className="mx-3 mb-2 rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-3">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <ChevronRight className="w-3 h-3 text-[#00D4D4]" />
          <span className="text-white text-xs font-medium">Project IRA</span>
        </div>
        <p className="text-xs text-[#64748B] mt-0.5 ml-5">
          Nokia 5G SA · 100 BTS
        </p>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-[#1E3A5F] shrink-0">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00D4D4] to-[#7c3aed] flex items-center justify-center text-xs font-bold text-white">
          BK
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white">Budi K.</span>
          <span className="text-[10px] text-[#64748B]">Project Manager</span>
        </div>
      </div>
    </aside>
    </>
  )
}
