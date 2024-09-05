import express from 'express';

const httpPort = 8888;

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello world!');
  });

  app.get('/exit', (req, res) => {
    res.send('exited');
    process.exit(0);
  });

  app.listen(httpPort, () => {
    console.log(`HTTP server listening on port ${httpPort}`);
  });
}

main();
