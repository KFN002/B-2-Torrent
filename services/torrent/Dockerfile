FROM golang:1.26-alpine AS builder

WORKDIR /build

RUN apk add --no-cache git upx

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o torrent-service ./services/torrent/main.go
RUN upx --best --lzma torrent-service

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/torrent-service /torrent-service

EXPOSE 50052

ENTRYPOINT ["/torrent-service"]
