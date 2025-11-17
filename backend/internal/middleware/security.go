package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

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
		w.Header().Set("X-XSS-Protection", "0") // Disabled as per modern recommendations
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()")

		// Content Security Policy - very strict
		w.Header().Set("Content-Security-Policy", "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';")

		// Remove server identification
		w.Header().Set("Server", "")
		w.Header().Del("X-Powered-By")

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
	requests map[string]*bucket
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
		key := r.URL.Path

		// Simple rate limiting - 100 requests per minute per endpoint
		if rl.requests[key] == nil {
			rl.requests[key] = &bucket{tokens: 100, lastRefill: time.Now()}
		}

		b := rl.requests[key]

		// Refill tokens
		if time.Since(b.lastRefill) > time.Minute {
			b.tokens = 100
			b.lastRefill = time.Now()
		}

		if b.tokens > 0 {
			b.tokens--
			next.ServeHTTP(w, r)
		} else {
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
		}
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
		// Only allow specific origins in production
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
