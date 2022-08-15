#!/bin/bash

# Increase node max space size
export NODE_OPTIONS=--max_old_space_size=4096

# Build
yarn build:styles
yarn build:js

# Running app
yarn start
