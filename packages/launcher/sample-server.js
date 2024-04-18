const http = require('http');

function getPort() {
  if (process.argv.includes('-p')) {
    const idx = process.argv.indexOf('-p');
    const port = Number(process.argv[idx + 1]);
    if (port) {
      return port;
    }
  }
  return 8080;
}

const port = getPort();

const server = http.createServer((req, res) => {
  res.write('hello');
  res.end();
  if (req.url === '/exit') {
    process.exit(0);
  }
});

server.listen(port, () => {
  console.log(`server listening on ${port}`);
});

process.on('SIGINT', () => {
  console.log('cp sigint');
  process.exit(130);
});
