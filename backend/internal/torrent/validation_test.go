package torrent

import "testing"

func TestValidateMagnetURI(t *testing.T) {
	validHash := "0123456789abcdef0123456789abcdef01234567"

	tests := []struct {
		name       string
		magnet     string
		torEnabled bool
		wantErr    bool
	}{
		{
			name:    "valid minimal magnet",
			magnet:  "magnet:?xt=urn:btih:" + validHash,
			wantErr: false,
		},
		{
			name:    "missing btih",
			magnet:  "magnet:?dn=example",
			wantErr: true,
		},
		{
			name:    "private tracker blocked",
			magnet:  "magnet:?xt=urn:btih:" + validHash + "&tr=udp://127.0.0.1:6969/announce",
			wantErr: true,
		},
		{
			name:    "web seed blocked",
			magnet:  "magnet:?xt=urn:btih:" + validHash + "&ws=https://example.com/file.iso",
			wantErr: true,
		},
		{
			name:       "onion tracker requires tor",
			magnet:     "magnet:?xt=urn:btih:" + validHash + "&tr=udp://exampleonionaddress.onion:6969/announce",
			torEnabled: false,
			wantErr:    true,
		},
		{
			name:       "onion tracker allowed with tor",
			magnet:     "magnet:?xt=urn:btih:" + validHash + "&tr=udp://exampleonionaddress.onion:6969/announce",
			torEnabled: true,
			wantErr:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateMagnetURI(tt.magnet, tt.torEnabled)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ValidateMagnetURI() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateMagnetURIBlocksUDPTrackersWhenPolicyRequires(t *testing.T) {
	validHash := "0123456789abcdef0123456789abcdef01234567"
	err := ValidateMagnetURIWithPolicy("magnet:?xt=urn:btih:"+validHash+"&tr=udp://tracker.example:6969/announce", MagnetValidationPolicy{
		TorEnabled:       true,
		AllowUDPTrackers: false,
	})
	if err == nil {
		t.Fatal("expected UDP tracker to be blocked")
	}
}

func TestIsValidInfoHash(t *testing.T) {
	if !IsValidInfoHash("0123456789abcdef0123456789abcdef01234567") {
		t.Fatal("expected 40 character hex info hash to be valid")
	}
	if IsValidInfoHash("../not-an-infohash") {
		t.Fatal("expected path-like value to be invalid")
	}
}
