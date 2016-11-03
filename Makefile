.PHONY: default setup build clean watch test

# Put Node bins in path
export PATH := node_modules/.bin:$(PATH)

default: build

setup:
	npm install

clean:
	rm -rf pub

build: clean
	webpack

watch:
	webpack-dev-server --content-base pub/ --port 5000 --host 0.0.0.0 --inline

test:
	mocha --recursive --reporter spec --bail \
  --require test-helpers/init.ts \
  --compilers ts:ts-node/register,tsx:ts-node/register \
  ts/**/*.test.*

prod:
	NODE_ENV=production $(MAKE) build

