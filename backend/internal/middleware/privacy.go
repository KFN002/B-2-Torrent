package middleware

import (
	"github.com/gin-gonic/gin"
)

// NoLogging middleware prevents Gin from logging requests
func NoLogging() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

// SecurityHeaders adds security headers to all responses
func GinSecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent browser from caching any data
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, private")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")

		// Security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "no-referrer")
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Remove server identification
		c.Header("Server", "")

		c.Next()
	}
}

// RemoveHeaders removes identifying headers from responses
func RemoveHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Remove any headers that could identify the server
		c.Writer.Header().Del("X-Powered-By")
		c.Writer.Header().Del("Server")
	}
}
