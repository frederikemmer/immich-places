package main

import (
	"testing"
)

func TestEncryptDecryptRoundTrip(t *testing.T) {
	key := deriveKey("test-secret")
	plaintext := "my-immich-api-key-12345"

	encrypted, err := encryptValue(key, plaintext)
	if err != nil {
		t.Fatalf("encryptValue: %v", err)
	}
	if encrypted == plaintext {
		t.Error("encrypted value should differ from plaintext")
	}
	if encrypted[:len(encryptedPrefix)] != encryptedPrefix {
		t.Errorf("expected prefix %q, got %q", encryptedPrefix, encrypted[:len(encryptedPrefix)])
	}

	decrypted, err := decryptValue(key, encrypted)
	if err != nil {
		t.Fatalf("decryptValue: %v", err)
	}
	if decrypted != plaintext {
		t.Errorf("expected %q, got %q", plaintext, decrypted)
	}
}

func TestDecryptPlaintextPassthrough(t *testing.T) {
	key := deriveKey("test-secret")
	plaintext := "legacy-plaintext-key"

	result, err := decryptValue(key, plaintext)
	if err != nil {
		t.Fatalf("decryptValue on plaintext: %v", err)
	}
	if result != plaintext {
		t.Errorf("expected passthrough %q, got %q", plaintext, result)
	}
}

func TestDecryptWrongKeyFails(t *testing.T) {
	key1 := deriveKey("secret-1")
	key2 := deriveKey("secret-2")

	encrypted, err := encryptValue(key1, "some-value")
	if err != nil {
		t.Fatalf("encryptValue: %v", err)
	}

	_, err = decryptValue(key2, encrypted)
	if err == nil {
		t.Error("expected error when decrypting with wrong key")
	}
}

func TestEncryptProducesDifferentCiphertexts(t *testing.T) {
	key := deriveKey("test-secret")
	plaintext := "same-value"

	enc1, _ := encryptValue(key, plaintext)
	enc2, _ := encryptValue(key, plaintext)

	if enc1 == enc2 {
		t.Error("expected different ciphertexts for same plaintext (random nonce)")
	}
}
