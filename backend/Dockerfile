FROM golang:1.26-alpine AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/b2torrent ./cmd/server

FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata wget tini && \
    addgroup -S b2torrent && \
    adduser -S -G b2torrent -h /app b2torrent && \
    mkdir -p /data/downloads /tmp/b2torrent-temp /tmp/b2torrent-uploads && \
    chown -R b2torrent:b2torrent /data /tmp/b2torrent-temp /tmp/b2torrent-uploads /app

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV DOWNLOAD_DIR=/data/downloads

COPY --from=builder /out/b2torrent /usr/local/bin/b2torrent

USER b2torrent

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["b2torrent"]
