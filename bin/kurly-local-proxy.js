#!/usr/bin/env node
const path = require('path');
const {register} = require('..');
const {createServer} = require('http');

function getPort(defaultPort) {
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
  '--port': Number,
  '-p': '--port',
});

async function main() {
  console.log(args['next']);

  try {

    /** @type {number} */
    const port = args['--port'] || Number(process.env.PORT) ||
        (await getPort(3000));

    /** @type {KurlyLocalProxyOption} */
    const config = require(path.join(process.cwd(), '.klprc.js'));
    await register(port, config);
  } catch (e) {
    console.error(e);
  }
}

main();