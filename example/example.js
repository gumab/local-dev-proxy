const express = require('express');

const httpPort = 8888;

async function main() {
  // await new Promise(resolve => setTimeout(resolve, 10000));
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello world!');
  });

  app.listen(httpPort, () => {
    console.log(`HTTP server listening on port ${httpPort}`);
  });
}

main();
