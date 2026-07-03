"use client"

import { usePathname } from "next/navigation"
import { Geist, Geist_Mono } from "next/font/google"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tracker": "BTS Tracker",
  "/spv": "SPV Queue",
  "/agents": "Agent Monitor",
  "/reports": "Reports",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "AI·PMO"

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0D1B2A] text-[#E2E8F0]">
        <div className="flex min-h-full">
          <Sidebar />
          <div className="flex flex-col flex-1 ml-[220px]">
            <Header title={title} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
