package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
)

const (
	defaultEndpointRateLimit = 100
	maxRateLimitBuckets      = 512
)

var hashLikePathSegment = regexp.MustCompile(`(?i)/[a-f0-9]{40,64}(/|$)|/[a-z2-7]{32}(/|$)`)

// SecurityHeaders adds comprehensive security headers
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent browser from caching any data
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "0")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), autoplay=()")

		// Strict Content Security Policy
		w.Header().Set("Content-Security-Policy", "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; base-uri 'self'; form-action 'self';")

		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		w.Header().Set("Server", "")
		w.Header().Del("X-Powered-By")
		w.Header().Del("X-AspNet-Version")
		w.Header().Del("X-AspNetMvc-Version")

		next.ServeHTTP(w, r)
	})
}

// AnonymityHeaders removes identifying information
func AnonymityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Remove any headers that could identify the server or user
		w.Header().Del("X-Powered-By")
		w.Header().Del("Server")
		w.Header().Del("X-AspNet-Version")
		w.Header().Del("X-AspNetMvc-Version")

		next.ServeHTTP(w, r)
	})
}

// RateLimiter implements token bucket rate limiting for fault tolerance
type RateLimiter struct {
	mu        sync.Mutex
	requests  map[string]*bucket
	lastSweep time.Time
}

type bucket struct {
	tokens     int
	lastRefill time.Time
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		requests: make(map[string]*bucket),
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Rate limit by endpoint, not IP for privacy
		key := r.Method + " " + normalizeRateLimitPath(r.URL.Path)

		rl.mu.Lock()
		if rl.requests[key] == nil {
			rl.requests[key] = &bucket{tokens: defaultEndpointRateLimit, lastRefill: time.Now()}
		}
		rl.sweepLocked(time.Now())

		b := rl.requests[key]

		// Refill tokens
		if time.Since(b.lastRefill) > time.Minute {
			b.tokens = defaultEndpointRateLimit
			b.lastRefill = time.Now()
		}

		if b.tokens > 0 {
			b.tokens--
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
		} else {
			rl.mu.Unlock()
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
		}
	})
}

func (rl *RateLimiter) sweepLocked(now time.Time) {
	if len(rl.requests) <= maxRateLimitBuckets && now.Sub(rl.lastSweep) < 5*time.Minute {
		return
	}
	rl.lastSweep = now
	for key, bucket := range rl.requests {
		if now.Sub(bucket.lastRefill) > 2*time.Minute {
			delete(rl.requests, key)
		}
	}
}

func normalizeRateLimitPath(path string) string {
	return hashLikePathSegment.ReplaceAllStringFunc(path, func(segment string) string {
		if strings.HasSuffix(segment, "/") {
			return "/:infoHash/"
		}
		return "/:infoHash"
	})
}

// GenerateNonce creates a cryptographically secure random nonce
func GenerateNonce() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

// CORS middleware with security in mind
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if !originAllowed(origin) {
				http.Error(w, "CORS origin denied", http.StatusForbidden)
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Add("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-B2-API-Key")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func APIKey(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		expected := strings.TrimSpace(os.Getenv("B2_API_TOKEN"))
		if expected == "" || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		provided := strings.TrimSpace(r.Header.Get("X-B2-API-Key"))
		if provided == "" {
			provided = strings.TrimSpace(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "))
		}

		if subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func LimitRequestBody(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}

func originAllowed(origin string) bool {
	allowed := os.Getenv("CORS_ALLOWED_ORIGINS")
	if strings.TrimSpace(allowed) == "" {
		allowed = "http://localhost,http://localhost:3000,http://127.0.0.1,http://127.0.0.1:3000"
	}

	for _, candidate := range strings.Split(allowed, ",") {
		if strings.TrimSpace(candidate) == origin {
			return true
		}
	}
	return false
}
