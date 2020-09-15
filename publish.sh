#!/bin/bash

# Pranay needs to run this. Let him know if you want to publish a new version

PKG_DIRS=$(ls packages)

if [ -z $1 ]; then
  echo "Usage: ./publish.sh <major|minor|patch|prerelease>"
  exit 1
fi

# Bump all versions
for pkg in $PKG_DIRS; do
  rm -rf .yarn/versions
  cd "packages/$pkg"
  yarn version $1
  cd ../../
done
rm -rf .yarn/versions

# Publish each one
for pkg in $PKG_DIRS; do
  cd "packages/$pkg"
  if [ "$1" == "prerelease" ]; then
    yarn npm publish --access public --tag next
  else
    yarn npm publish --access public
  fi
  cd ../../
done

# Update "format" lib in vscode and publish
cd vscode
if [ "$1" == "prerelease" ]; then
  yarn add @browselang/format@next
  vsce publish patch
else
  yarn add @browselang/format@latest
  vsce publish $1
fi
cd ..
