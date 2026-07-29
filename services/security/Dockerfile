FROM golang:1.26-alpine AS builder

WORKDIR /build/services

RUN apk add --no-cache ca-certificates git upx

COPY services/go.mod services/go.sum ./
COPY backend/go.mod backend/go.sum /build/backend/
RUN go mod download

COPY backend /build/backend
COPY services /build/services

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o security-service ./security
RUN upx --best --lzma security-service

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/services/security-service /security-service

USER 65532:65532

EXPOSE 50053

ENTRYPOINT ["/security-service"]
