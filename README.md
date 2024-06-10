[![](https://img.shields.io/badge/lang-ko-green.svg)](./README.ko.md)
[![](https://img.shields.io/badge/lang-en-blue.svg)](./README.md)

# Local Dev Proxy

A proxy server to assist with running multiple server services simultaneously on ports 80 (HTTP) and 443 (HTTPS) in a
local development environment.

[![](https://img.shields.io/npm/v/local-dev-proxy?logo=npm)](https://www.npmjs.com/package/local-dev-proxy)
[![](https://img.shields.io/badge/github-gumab/local--dev--proxy-blue?logo=github)](https://github.com/gumab/local-dev-proxy)
[![](https://img.shields.io/badge/OS-macOS(ARM64)_only-red)](https://support.apple.com/en-us/116943)

## Overview

<img src="./docs/diagram.svg">

Managing multiple servers during local development can be challenging. Often, you might want to run multiple servers
simultaneously on port 80. **Local Dev Proxy** addresses this issue by dynamically registering local servers and routing
requests to the appropriate server based on predefined configurations.

## Key Features

- Access multiple local servers simultaneously on ports 80 and 443.
- Route requests to the appropriate local server based on host or path configuration.
- Automatically register host in the `/etc/hosts` file
- HTTPS support:
    - Automatically issues and applies certificates for local domains.

## Components

### Server

- A Docker server acting as a proxy.
- Occupies ports 80/443.
- Registers/unregisters local servers via an API.
- Routes requests to the target server based on registered rules.

### Launcher

- Located within each project as a library.
- Runs the proxy server (if not already running).
- Registers the port occupied by the currently running process with the server.
- Configures host information through a configuration file.
- Handles additional processing if host configuration is missing.

## Flow

<img src="./docs/flow.svg">

## Quick Start

### 1. Installation

```bash
# If not installed as optional, errors may occur during npm install on Linux servers, etc.
$ npm install local-dev-proxy --optional
```

### 2. Configure the Configuration File

Create a `.ldprxrc.js` file in the project root and add the following content:

```js
/** @type {import('local-dev-proxy').LocalDevProxyOption} */
module.exports = {
  rule: {
    key: 'sample-key',
    host: 'simple.local.your-domain.com',
  },
};
```

[Configuration File Samples](./packages/launcher/config-samples)

### 3. Run

#### `package.json`

```json
"scripts": {
"start": "ldprx your-run-command"
}
```

Or

```bash
$ npx ldprx your-run-command
```

[Example App](./example)
