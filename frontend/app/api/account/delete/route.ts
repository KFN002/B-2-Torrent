import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server"

const confirmation = "DELETE MY LOCAL IDENTITY"
const bucket = "private-vault"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
    }
  }

  const body = await request.json().catch(() => null)
  if (body?.confirm !== confirmation) {
    return NextResponse.json({ error: `Confirmation must exactly match: ${confirmation}` }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const admin = createAdminClient()
    for (let batch = 0; batch < 100; batch += 1) {
      const { data: objects, error: listError } = await admin.storage.from(bucket).list(data.user.id, { limit: 1000 })
      if (listError) throw listError
      if (!objects?.length) break
      const paths = objects.map((object) => `${data.user.id}/${object.name}`)
      const { error: storageError } = await admin.storage.from(bucket).remove(paths)
      if (storageError) throw storageError
      if (batch === 99) throw new Error("Vault contains too many objects for one deletion request")
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id, false)
    if (deleteError) throw deleteError

    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Deletion failed" }, { status: 500 })
  }
}
