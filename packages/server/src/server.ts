import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createSecureContext } from 'tls';
import settingRouter from './routes/__setting';
import { proxyMiddleware, proxyWebSocket } from './routes/proxy';

const httpPort = Number(process.env.HTTP_PORT) || 80;
const httpsPort = Number(process.env.HTTPS_PORT) || 443;

const app = express();
app.use('/__setting', settingRouter);
app.use(proxyMiddleware);

const httpServer = http.createServer(app).listen(httpPort, () => {
  console.log(`HTTP server listening on port ${httpPort}`);
});

const keyFile = fs.readFileSync(path.join(process.cwd(), './keys/key.pem'));
const defaultCertFile = fs.readFileSync(path.join(process.cwd(), './keys/cert.pem'));

export const certs: { [domain: string]: Buffer | undefined } = {};

function getCert(domain: string) {
  const exists = certs[domain];
  if (exists) {
    return exists;
  } else {
    const file = fs.readFileSync(path.join(process.cwd(), `./keys/${domain}.pem`));
    certs[domain] = file;
    return file;
  }
}

const httpsServer = https
  .createServer(
    {
      SNICallback: (domain, callback) => {
        try {
          callback(
            null,
            createSecureContext({
              key: keyFile,
              cert: getCert(domain),
            }),
          );
        } catch (e) {
          callback(
            null,
            createSecureContext({
              key: keyFile,
              cert: defaultCertFile,
            }),
          );
        }
      },
      key: keyFile,
      cert: defaultCertFile,
    },
    app,
  )
  .listen(httpsPort, () => {
    console.log(`HTTPS server listening on port ${httpsPort}`);
  });

httpServer.on('upgrade', proxyWebSocket);
httpsServer.on('upgrade', proxyWebSocket);

// Graceful Shutdown 비활성
// const signals: { [key: string]: number } = {
//   SIGINT: 2,
//   SIGTERM: 15,
// };
//
// let exited = false;
//
// async function shutdown(signal: string, value: number) {
//   if (exited) {
//     return;
//   }
//   exited = true;
//   console.log(`Process stopped by ${signal}`);
//
//   const timeout = setTimeout(() => {
//     console.log('graceful shutdown timed out after 3000ms');
//     process.exit(128 + value);
//   }, 3000);
//   await Promise.all([
//     new Promise<void>((resolve) =>
//       httpServer.close(() => {
//         console.log('http server closed');
//         resolve();
//       }),
//     ),
//     new Promise<void>((resolve) =>
//       httpsServer.close(() => {
//         console.log('https server closed');
//         resolve();
//       }),
//     ),
//   ]);
//   clearTimeout(timeout);
//   console.log('all server closed ');
//   process.exit(128 + value);
// }
//
// Object.keys(signals).forEach((signal) => {
//   process.on(signal, () => {
//     void shutdown(signal, signals[signal]);
//   });
// });
