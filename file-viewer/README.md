# B2 Safe File Viewer

Standalone local file viewer for security-focused inspection and deliberate deletion.

## Features

- Opens files through the native desktop picker and keeps operations scoped to files opened in the current session.
- Calculates SHA-256 with a streaming hash in the main process.
- Shows metadata, magic-signature detection, entropy, text preview, media preview, and hex preview.
- Displays risk indicators for executable signatures, active document types, double extensions, and high-entropy packed/encrypted files.
- Supports OS trash and explicit overwrite-then-unlink deletion with exact filename confirmation.
- Runs the renderer with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, no persistent cache, and no history.

## Run

```bash
cd file-viewer
npm install
npm start
```

## Build

```bash
cd file-viewer
npm run build:linux
```

Linux packages are configured for AppImage, `.deb`, and `.tar.gz`. RPM is available separately with `npm run build:linux:rpm` on systems with `rpmbuild`.

## Deletion Caveat

Overwrite deletion is best effort. SSD wear leveling, copy-on-write filesystems, snapshots, cloud sync, backups, journaling, and controller remapping can preserve earlier data outside app control. For high-risk material, prefer full-disk encryption, encrypted work directories, disabled snapshots, and destroying encryption keys.
