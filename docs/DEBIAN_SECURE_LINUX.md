# Debian And Secure Linux Hardening

This guide is for Debian stable, Debian-derived hardened desktops, Qubes OS AppVMs, Whonix/Kicksecure-style workstations, and other security-focused Linux environments.

B-2-Torrent can reduce exposure, but it cannot guarantee anonymity. Treat BitTorrent as high-metadata traffic: isolate it from personal browsing, verify routing before use, and keep legal/authorized content boundaries clear.

## Recommended Layout

Use a dedicated Unix user and a private working directory:

```bash
sudo adduser --disabled-password --gecos "" b2torrent
sudo install -d -o b2torrent -g b2torrent -m 0700 /srv/b2torrent
sudo install -d -o b2torrent -g b2torrent -m 0700 /srv/b2torrent/downloads
```

Keep `.env`, downloads, temporary files, and backups under encrypted storage. LUKS, fscrypt, or a Qubes private volume are better foundations than relying on overwrite deletion later.

## Debian Install Path

```bash
sudo apt update
sudo apt install -y ca-certificates curl git make nodejs npm

git clone https://github.com/KFN002/B-2-Torrent.git
cd B-2-Torrent
node scripts/gen-env.mjs
corepack enable
pnpm --dir frontend install --frozen-lockfile
docker compose build
docker compose up -d
```

If Docker is not appropriate for your host, run it inside a dedicated VM or use a rootless container profile. Keep exposed ports bound to `127.0.0.1` unless you have a reviewed reverse proxy and authentication layer.

## Host Firewall Baseline

For a single-user workstation that only needs local access:

```bash
sudo apt install -y nftables
sudo systemctl enable --now nftables
```

Example local-only policy:

```nft
table inet b2torrent_local {
  chain input {
    type filter hook input priority 0; policy drop;
    iif lo accept
    ct state established,related accept
    ip protocol icmp accept
    ip6 nexthdr icmpv6 accept
  }
}
```

Do not apply that snippet on a remote host until you add the SSH or management ports you need.

## Kernel And Network Defaults

Create `/etc/sysctl.d/99-b2torrent-hardening.conf`:

```conf
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 2
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv6.conf.all.use_tempaddr = 2
net.ipv6.conf.default.use_tempaddr = 2
net.ipv4.tcp_congestion_control = bbr
```

Apply with:

```bash
sudo sysctl --system
```

Use BBR only when supported by your kernel and network policy. If your anonymity route performs worse with BBR, revert to the distribution default.

## Docker Hardening

The Compose stack already uses localhost port bindings, `no-new-privileges`, capability drops, read-only filesystems where practical, and generated secrets. On hardened Linux hosts, also consider:

- Rootless Docker or a dedicated VM for the stack.
- AppArmor or SELinux confinement for container runtimes.
- A separate encrypted volume for `DOWNLOAD_DIR`.
- No bind mounts beyond the download directory and read-only config files.
- Regular rebuilds after base image security updates.

## Qubes, Whonix, Kicksecure, And Tails Notes

- Qubes OS: run B-2-Torrent in a dedicated AppVM, route it through a dedicated NetVM/VPN VM, and keep personal browsing in another qube.
- Whonix/Kicksecure: avoid mixing personal identities with torrent workflows. Verify whether BitTorrent over Tor fits your threat model before enabling it.
- Tails: prefer non-persistent testing. Do not assume Docker or long-lived downloads are appropriate for the live session model.
- Disposable VMs: ideal for inspecting untrusted files with B2 Safe File Viewer before moving anything into a trusted workspace.

## Safe File Viewer

Build the standalone viewer on Linux:

```bash
cd file-viewer
npm install
npm run build:linux
```

The viewer supports OS trash and overwrite-then-unlink deletion. Overwrite deletion is best effort; SSD wear leveling, copy-on-write filesystems, snapshots, backups, and cloud sync can keep older data outside app control. For the strongest deletion story, store sensitive files encrypted and destroy the key.

## Verification Checklist

Before adding torrents or inspecting untrusted files:

- Confirm `docker compose ps` shows only the services you expect.
- Confirm app ports are bound to `127.0.0.1`.
- Run independent IP/DNS/WebRTC leak tests through the same route you plan to use.
- Confirm downloads land on encrypted storage.
- Keep the standalone viewer and browser in separate disposable or low-trust environments when handling unknown files.
- Avoid opening active documents directly from the download directory.
