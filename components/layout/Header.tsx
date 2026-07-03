"use client"

import { Bell } from "lucide-react"

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[#1E3A5F] bg-[#0D1B2A] px-6 shrink-0">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-5">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10B981]" />
          </span>
          <span className="text-xs font-medium text-[#10B981]">Live</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#1E3A5F]/50 transition-colors"
        >
          <Bell className="w-4 h-4 text-[#64748B]" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-white px-1">
            3
          </span>
        </button>
      </div>
    </header>
  )
}
