const statusStyles: Record<string, { bg: string; text: string }> = {
  "On Air": { bg: "#064E3B", text: "#10B981" },
  "Integration Done": { bg: "#065F46", text: "#34D399" },
  "Integration Ongoing": { bg: "#1E3A5F", text: "#60A5FA" },
  "Pre-Test Pass": { bg: "#2E1065", text: "#818CF8" },
  "Pre-Test Ongoing": { bg: "#3B0764", text: "#A78BFA" },
  "MOP Approved": { bg: "#451A03", text: "#FBBF24" },
  "MOP Submitted": { bg: "#451A03", text: "#FBBF24" },
  "Transport Ordered": { bg: "#431407", text: "#FB923C" },
  "Transport Survey": { bg: "#431407", text: "#FB923C" },
  "Design Planning": { bg: "#1E293B", text: "#94A3B8" },
  "Not Started": { bg: "#0F172A", text: "#475569" },
  Blocked: { bg: "#450A0A", text: "#F87171" },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || { bg: "#1E293B", text: "#94A3B8" }
  return (
    <span
      className="inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  )
}
