.PHONY: test vet vulncheck lint

test:
	go test ./...

vet:
	go vet ./...

vulncheck:
	go run golang.org/x/vuln/cmd/govulncheck@latest ./...

lint: vet vulncheck
	@echo "All checks passed"
