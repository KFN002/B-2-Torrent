import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

function serverUrl() {
  return process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
}

export async function createServerSupabaseClient() {
  const url = serverUrl()
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("Local Supabase is not configured")
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookieOptions: {
      name: "b2-auth",
      sameSite: "lax",
      secure: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").startsWith("https://"),
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot write cookies. Route handlers can.
        }
      },
    },
  })
}

export function createAdminClient() {
  const url = serverUrl()
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error("Supabase server administration is not configured")
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
