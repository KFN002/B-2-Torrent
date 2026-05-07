FROM golang:1.23-alpine AS builder

WORKDIR /build

RUN apk add --no-cache git upx

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o security-service ./services/security/main.go
RUN upx --best --lzma security-service

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/security-service /security-service

EXPOSE 50053

ENTRYPOINT ["/security-service"]
