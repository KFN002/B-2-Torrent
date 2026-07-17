# Hardened local architecture

## Trust zones

The Compose topology uses four explicit boundaries:

- `edge` is internal and contains only Nginx, the frontend, and backend. Only Nginx publishes a host port, bound to `127.0.0.1`.
- `data` is internal and contains the backend, Postgres, Redis, and RabbitMQ. None publish host ports.
- `privacy` is internal and connects the backend only to Tor. The backend has no directly Internet-routable Docker network.
- `tor-egress` is attached to Tor, not the backend. Tor is the sole egress bridge for torrent runtime traffic.
- `auth-egress` lets the frontend server reach a separately self-hosted Supabase gateway. Set `SUPABASE_INTERNAL_URL` to an explicit local address. Docker bridge networks do not enforce destination allowlists, so use a host firewall rule if the frontend must be prevented from reaching any destination except that gateway.

Containers run with `no-new-privileges`, bounded PID counts, health checks, graceful-stop windows, dropped capabilities where compatible, and read-only root filesystems for stateless services. Data stores retain writable named volumes by design.

This reduces lateral movement and accidental direct egress. It does not make a host non-traceable: the OS, ISP, proxy operator, trackers, peers, DNS path, and endpoint metadata can still identify activity.

## Fault-tolerance patterns

- Startup dependencies use health-gated ordering.
- Database startup uses five bounded exponential-backoff attempts, then fails closed.
- HTTP servers have header, read, write, idle, body-size, and header-size limits plus graceful shutdown.
- Postgres uses bounded connection pools and query contexts.
- RabbitMQ messages are persistent; failed consumer messages dead-letter instead of requeueing forever.
- Redis is a disposable cache with a memory ceiling and eviction policy; authoritative state stays in Postgres.
- Services use `restart: unless-stopped`, while health checks expose crash loops to the operator.

For stronger availability, add tested Postgres backups and restore drills before replication. Replication without restore testing only duplicates corruption. Do not back up Auth refresh tokens or private files to a third party unless the backup is independently encrypted.

## Data-intensive options

The default is intentionally small and private. Scale deliberately:

- Keep mutable torrent progress in memory and persist only bounded active state. Magnet URIs are erased from Postgres.
- Index status and update time for bounded operational queries; cap result sets.
- Use RabbitMQ for asynchronous work that must survive process restarts. Add idempotency keys before introducing multiple consumers.
- Use Redis only for recomputable values with finite TTLs. Never cache Supabase service keys, passwords, magnet URIs, or decrypted file contents.
- Keep Supabase Storage private with user-ID path partitioning and RLS. Large files should use resumable uploads and explicit quotas before raising the 50 MiB default.
- Partition or delete high-volume event tables by retention window instead of keeping indefinite activity history. Privacy mode should prefer aggregation or no collection.

## Operational options

- Pin every container image to a reviewed version or digest. The Tor image remains an operator-selected supply-chain risk until pinned and should be updated only after validation.
- Terminate TLS at Nginx before any non-loopback deployment. HSTS is emitted only for HTTPS.
- Rotate database, RabbitMQ, Supabase secret, and JWT signing keys on a documented schedule.
- Keep external leak checks disabled by default. Enabling them discloses the current public IP to the selected service.
- Use full-disk encryption for reliable at-rest protection and cryptographic erasure. Multi-pass overwrites are not reliable on SSDs, snapshots, or copy-on-write filesystems.
