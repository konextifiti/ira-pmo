"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { LoaderCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D1B2A]">
      <div className="w-full max-w-sm rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">AI·PMO</h1>
          <p className="text-sm text-[#64748B] mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[#94A3B8] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1E3A5F] bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#00D4D4] transition-colors"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-[#94A3B8] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1E3A5F] bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder-[#64748B] outline-none focus:border-[#00D4D4] transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-[#F87171] bg-[#F87171]/10 rounded px-2 py-1.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00D4D4] px-4 py-2 text-sm font-medium text-[#0A1628] hover:bg-[#00D4D4]/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}
