.PHONY: help install client-install worker-install server-install \
        dev dev-client dev-worker dev-server \
        build build-client typecheck-worker \
        test test-client test-worker test-server \
        migrate-local migrate-dev migrate-prod \
        deploy-dev deploy-prod \
        tail-dev tail-prod \
        cf-login cf-setup-dev cf-setup-prod \
        clean

WRANGLER ?= npx wrangler

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---- install ----------------------------------------------------------------

install: client-install worker-install ## Install client + worker deps

client-install: ## npm ci in client/
	cd client && npm ci

worker-install: ## npm ci in worker/
	cd worker && npm ci

server-install: ## npm ci in server/ (Express legacy)
	cd server && npm ci

# ---- local dev --------------------------------------------------------------

dev: ## Run client (Vite) against the dev Cloudflare backend
	cd client && npm run dev

dev-client: dev ## Alias for `dev`

dev-worker: ## Run worker locally on :8787 (uses local D1 sim)
	cd worker && npm run dev

dev-server: ## Run legacy Express server locally on :3001
	cd server && npm run dev

# ---- build ------------------------------------------------------------------

build: build-client ## Build everything that's deployable

build-client: ## Build the Vite client to client/dist
	cd client && npm run build

typecheck-worker: ## Type-check the worker without emitting
	cd worker && npm run typecheck

# ---- test -------------------------------------------------------------------

test: test-worker test-client ## Run worker + client tests

test-client: ## Run client tests
	cd client && npm test

test-worker: ## Run worker tests (Miniflare-backed Vitest)
	cd worker && npm test

test-server: ## Run legacy Express server tests
	cd server && npm test

# ---- D1 migrations ----------------------------------------------------------

migrate-local: ## Apply migrations to local D1 sim
	cd worker && npm run db:migrate:local

migrate-dev: ## Apply migrations to dev D1 (trek-db-dev)
	cd worker && npm run db:migrate:dev

migrate-prod: ## Apply migrations to prod D1 (trek-db) — confirm before running
	cd worker && npm run db:migrate:prod

# ---- deploy -----------------------------------------------------------------

deploy-dev: build-client ## Build client then deploy worker to dev env
	cd worker && npm run deploy:dev

deploy-prod: build-client ## Build client then deploy worker to prod env
	cd worker && npm run deploy:prod

tail-dev: ## Stream live logs from dev Worker
	cd worker && npm run tail:dev

tail-prod: ## Stream live logs from prod Worker
	cd worker && npm run tail:prod

# ---- one-time Cloudflare setup ---------------------------------------------

cf-login: ## Interactive `wrangler login`
	cd worker && $(WRANGLER) login

cf-setup-dev: ## Create dev D1 + R2 resources. Run once per account.
	cd worker && $(WRANGLER) d1 create trek-db-dev || true
	cd worker && $(WRANGLER) r2 bucket create trek-uploads-dev || true
	@echo ""
	@echo "Now copy the printed database_id into worker/wrangler.toml under [env.dev]."

cf-setup-prod: ## Create prod D1 + R2 resources. Run once per account.
	cd worker && $(WRANGLER) d1 create trek-db || true
	cd worker && $(WRANGLER) r2 bucket create trek-uploads || true

# ---- housekeeping -----------------------------------------------------------

clean: ## Remove build artifacts + node_modules
	rm -rf client/dist client/node_modules worker/node_modules server/node_modules
