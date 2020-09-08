#!/bin/bash

# Pranay needs to run this. Let him know if you want to publish a new version

PKG_DIRS=$(ls packages)

# Bump all versions
for pkg in $PKG_DIRS; do
  rm -rf .yarn/versions
  cd "packages/$pkg"
  yarn version $@
  cd ../../
done
rm -rf .yarn/versions

# Publish each one
for pkg in $PKG_DIRS; do
  cd "packages/$pkg"
  yarn npm publish --access public
  cd ../../
done

# Update "format" lib in vscode and publish
cd vscode
yarn add @browselang/format
vsce publish $@
cd ..
