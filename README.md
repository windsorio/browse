<img src="https://raw.githubusercontent.com/windsorio/browse/master/images/full.png" width=400 />

The Browse Language

> **IMPORTANT:** To use any of the scraping/web browser features, add `--web` when starting the browse repl or running a script

# Installation

To install locally, simply run

```bash
npm i -g @browselang/cli
```

If you use VSCode, get the [extension](https://marketplace.visualstudio.com/items?itemName=pranaygp.browse-vscode)

```bash
code --install-extension pranaygp.browse-vscode
```

# Usage

Hop into a browse repl

```bash
browse
```

Or execute a browse script

```bash
browse examples/basic/fibonacci.browse
```

# Documentation

### [It's all on the Wiki](https://github.com/windsorio/browse/wiki)

---

## Using browse with Docker

There's a pre-build docker image available called [pranaygp/browse](https://hub.docker.com/r/pranaygp/browse) that comes with browse and node preinstalled.

To hop into a browse repl, simply run

```bash
docker run --rm -it pranaygp/browse
```

Here's an example that can be run within this repo, that executes one of the example files

```bash
docker run --rm -it -v $(pwd)/examples:/examples pranaygp/browse /examples/fibonacci.browse
```
