# AOC website — common tasks. See README.md.
#
# Override the deploy target on the command line, e.g.:
#   make deploy SERVER=deploy@aoc.sn REMOTE_DIR=/var/www/aoc/dist

SERVER     ?= deploy@aoc.example.sn
REMOTE_DIR ?= /var/www/aoc/dist

.PHONY: install dev build preview deploy clean

install:        ## Install dependencies
	npm install

dev:            ## Run the site locally
	npm run dev

build:          ## Build the static site to dist/
	npm run build

preview:        ## Preview the production build
	npm run preview

deploy: build   ## Build then rsync dist/ to the server
	rsync -avz --delete dist/ $(SERVER):$(REMOTE_DIR)/
	@echo "Deployed to $(SERVER):$(REMOTE_DIR)"

clean:          ## Remove build artifacts
	rm -rf dist .astro
