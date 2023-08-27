#!/usr/bin/env node
const path = require('path');
const {register} = require('..');
const {createServer} = require('http');

function getPort(defaultPort) {
  if (!defaultPort) {
    throw new Error('port 옵션을 설정해주세요');
  }
  const server = createServer((req, res) => {
  });

  return new Promise((resolve, reject) => {
    let port = defaultPort;
    let retryCount = 0;
    server.on('error', (err) => {
      if (port && err.code === 'EADDRINUSE' && retryCount < 10) {
        port += 1;
        retryCount += 1;
        server.listen(port, '0.0.0.0');
      } else {
        reject(err);
      }
    });
    server.on('listening', () => {
      server.close(() => resolve(port));
    });
    server.listen(port, '0.0.0.0');
  });
}

const args = require('arg')({
  '--nextjs': Boolean,
  '--reactjs': Boolean,
  '--storybook': Boolean,
  '--port': Number,
  '-p': '--port',
  '--next': '--nextjs',
  '--react': '--reactjs',
  '--sb': '--storybook',
});

function getDefaultPort() {
  if (args['--nextjs']) {
    return 3000;
  } else if (args['--reactjs']) {
    return 3000;
  } else if (args['--storybook']) {
    return 6006;
  }
  return 0;
}

function getConfig() {
  try {
    return require(path.join(process.cwd(), '.klprc.js'));
  } catch (e) {
    throw new Error('.klprc.js 파일이 필요합니다');
  }
}

async function main() {
  /** @type {number} */
  const port = args['--port'] || Number(process.env.PORT) ||
      (await getPort(getDefaultPort()));

  /** @type {KurlyLocalProxyOption} */
  const config = getConfig();
  await register(port, config);
}

main();