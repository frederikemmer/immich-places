package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHardeningAllowsNormalRequest(t *testing.T) {
	called := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})
	handler := requestHardeningMiddleware(inner)

	req := httptest.NewRequest("GET", "/assets?page=1&pageSize=90", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if !called {
		t.Error("inner handler was not called")
	}
}

func TestHardeningRejectsLongQuery(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not have been called")
	})
	handler := requestHardeningMiddleware(inner)

	longQuery := strings.Repeat("a", maxQueryLength+1)
	req := httptest.NewRequest("GET", "/assets?q="+longQuery, nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestURITooLong {
		t.Errorf("expected 414, got %d", rec.Code)
	}
}

func TestHardeningLimitsBodySize(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := io.ReadAll(r.Body)
		if err == nil {
			t.Error("expected body read to fail due to size limit")
		}
		w.WriteHeader(http.StatusOK)
	})
	handler := requestHardeningMiddleware(inner)

	body := strings.NewReader(strings.Repeat("x", maxRequestBodyBytes+1))
	req := httptest.NewRequest("POST", "/sync", body)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
}

func TestHardeningSkipsBodyLimitForGET(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := requestHardeningMiddleware(inner)

	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}
