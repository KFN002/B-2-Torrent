package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNormalizeRateLimitPathRedactsInfoHash(t *testing.T) {
	got := normalizeRateLimitPath("/api/torrents/0123456789abcdef0123456789abcdef01234567/pause")
	want := "/api/torrents/:infoHash/pause"
	if got != want {
		t.Fatalf("normalizeRateLimitPath() = %q, want %q", got, want)
	}
}

func TestAPIKeyMiddlewareOptionalAndEnforced(t *testing.T) {
	handler := APIKey(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	t.Setenv("B2_API_TOKEN", "")
	optionalReq := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	optionalRes := httptest.NewRecorder()
	handler.ServeHTTP(optionalRes, optionalReq)
	if optionalRes.Code != http.StatusNoContent {
		t.Fatalf("optional token status = %d, want %d", optionalRes.Code, http.StatusNoContent)
	}

	t.Setenv("B2_API_TOKEN", "secret-token")
	deniedReq := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	deniedRes := httptest.NewRecorder()
	handler.ServeHTTP(deniedRes, deniedReq)
	if deniedRes.Code != http.StatusUnauthorized {
		t.Fatalf("missing token status = %d, want %d", deniedRes.Code, http.StatusUnauthorized)
	}

	allowedReq := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	allowedReq.Header.Set("X-B2-API-Key", "secret-token")
	allowedRes := httptest.NewRecorder()
	handler.ServeHTTP(allowedRes, allowedReq)
	if allowedRes.Code != http.StatusNoContent {
		t.Fatalf("valid token status = %d, want %d", allowedRes.Code, http.StatusNoContent)
	}
}
