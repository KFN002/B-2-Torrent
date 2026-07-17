# Local Supabase boundary

This app integrates with a **self-hosted** Supabase instance for anonymous Auth, Postgres RLS, and a private local Storage bucket. It intentionally does not require Supabase Cloud, social login, email, phone, analytics, or telemetry.

## Install the official self-hosted stack

Use Supabase's maintained Docker bundle rather than copying unpinned service definitions into this repository:

1. Follow the [official Docker self-hosting guide](https://supabase.com/docs/guides/self-hosting/docker) and keep its gateway bound to `127.0.0.1:8000`.
2. Generate all credentials with the supplied `utils/generate-keys.sh` and `utils/add-new-auth-keys.sh` scripts. Never use example keys.
3. Set `SITE_URL=http://localhost`, disable email/phone/OAuth providers, enable anonymous sign-ins, use short JWT expiry, and configure asymmetric signing keys. Anonymous users still use the `authenticated` role, so RLS remains mandatory.
4. Keep Studio, Postgres, and the pooler on loopback or an internal Docker network. Do not expose them to a LAN or the Internet.
5. Apply [202607170001_private_identity.sql](./migrations/202607170001_private_identity.sql) to create the private profile and Storage policies.

Supabase documents that its self-hosted Docker distribution does not phone home. The operator remains responsible for patches, backups, recovery testing, and key rotation.

## App configuration

Set these generated values in the root `.env`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
SUPABASE_INTERNAL_URL=http://host.docker.internal:8000
SUPABASE_SECRET_KEY=sb_secret_replace_me
```

The publishable key is intentionally public and is constrained by RLS. `SUPABASE_SECRET_KEY` bypasses RLS and is used only by the server-side full-deletion route; never prefix it with `NEXT_PUBLIC_` or expose it to the browser.

## Privacy and deletion

- Anonymous Auth avoids collecting direct identity attributes but does not make network activity untraceable.
- Storage objects are private and scoped to the first path segment matching `auth.uid()`.
- The app's deletion flow removes private Storage objects before deleting `auth.users`; profile rows cascade.
- Local Storage is not application-level encrypted at rest. Enable FileVault, BitLocker, LUKS, or equivalent full-disk encryption.
- SSD wear leveling means overwrite-based “secure delete” is not guaranteed. Cryptographic erasure through disk-key destruction is the stronger boundary.

For abandoned anonymous users, run a local privileged maintenance worker only after selecting and documenting a retention period. It must list and delete each user's objects through the Storage API before calling Auth Admin deletion; direct SQL deletion can orphan files in the object backend.
