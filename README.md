<img src="./images/full.png" width=400 />

The Browse Language

# Installation

To install locally, simply run

```bash
npm i -g @browselang/cli
```

# Usage

Hop into a browse repl

```bash
browse
```

Or execute a browse script

```bash
browse examples/fibonacci.browse
```

Check the [Wiki](https://github.com/windsorio/browse/wiki) for more documentation. This is temporary, and a proper, comprehensive, documentation site for browse will be available soon

# Docker

There's also a docker image available called [pranaygp/browse](https://hub.docker.com/r/pranaygp/browse) that comes with browse and node preinstalled.

To hop into a browse repl, simply run

```bash
docker run --rm -it pranaygp/browse
```

Here's an example that can be run within this repo, that executes one of the example files

```bash
docker run --rm -it -v $(pwd)/examples:/examples pranaygp/browse /examples/fibonacci.browse
```
