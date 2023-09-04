const http = require('http');

const server = http.createServer((req, res) => {
  res.write('hello');
  res.end();
  if (req.url === '/exit') {
    process.exit(0);
  }
});

server.listen(8080, () => {
  console.log(`server listening on ${8080}`);
});

process.on('SIGINT', () => {
  console.log('cp sigint');
  process.exit(130);
});
