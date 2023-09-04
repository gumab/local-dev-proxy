import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import settingRouter from './routes/__setting';
import proxy from './routes/proxy';

const httpPort = Number(process.env.HTTP_PORT) || 80;
const httpsPort = Number(process.env.HTTPS_PORT) || 443;

const app = express();
app.use('/__setting', settingRouter);
app.use(proxy);

const httpServer = app.listen(httpPort, () => {
  console.log(`HTTP server listening on port ${httpPort}`);
});

const httpsServer = https
  .createServer(
    {
      key: fs.readFileSync(path.join(process.cwd(), './keys/key.pem')),
      cert: fs.readFileSync(path.join(process.cwd(), './keys/cert.pem')),
    },
    app,
  )
  .listen(httpsPort, () => {
    console.log(`HTTPS server listening on port ${httpsPort}`);
  });

const signals: { [key: string]: number } = {
  SIGINT: 2,
  SIGTERM: 15,
};

let exited = false;

async function shutdown(signal: string, value: number) {
  if (exited) {
    return;
  }
  exited = true;
  console.log(`Process stopped by ${signal}`);
  await Promise.all([
    new Promise<void>((resolve) =>
      httpServer.close(() => {
        console.log('http server closed');
        resolve();
      }),
    ),
    new Promise<void>((resolve) =>
      httpsServer.close(() => {
        console.log('https server closed');
        resolve();
      }),
    ),
  ]);
  console.log('all server closed ');
  process.exit(128 + value);
}

Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    void shutdown(signal, signals[signal]);
  });
});
