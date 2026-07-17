import { createBrowserClient } from "@supabase/ssr"

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("Local Supabase is not configured")
  return createBrowserClient(url, key, {
    cookieOptions: { name: "b2-auth", sameSite: "lax", secure: url.startsWith("https://") },
  })
}
