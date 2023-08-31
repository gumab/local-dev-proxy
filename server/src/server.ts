import express from "express";
import https from "https";
import fs from "fs";
import settingRouter from "./routes/__setting"
import * as path from "path";
import proxy from "./routes/proxy";
import {ProxyGateway} from './proxy-gateway'

const httpPort = Number(process.env.HTTP_PORT) || 80;
const httpsPort = Number(process.env.HTTPS_PORT) || 443;
const proxyPort = Number(process.env.PROXY_PORT) || 8090;

const app = express();
app.use('/__setting', settingRouter)
app.use(proxy)

const httpServer = app.listen(httpPort, () => {
    console.log('HTTP server listening on port ' + httpPort);
});

const httpsServer = https.createServer({
    key: fs.readFileSync(path.join(process.cwd(), './keys/key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), './keys/cert.pem')),
}, app).listen(httpsPort, () => {
    console.log('HTTPS server listening on port ' + httpsPort);
});

const proxyGatewayServer = new ProxyGateway(httpPort, httpsPort).listen(proxyPort, () => {
    console.log('Proxy Gateway listening on port ' + proxyPort);
});


const signals: { [key: string]: number } = {
    'SIGINT': 2, 'SIGTERM': 15,
};

let exited = false;

async function shutdown(signal: string, value: number) {
    if (exited) {
        return;
    }
    exited = true;
    console.log('[local-dev-proxy] stopped by ' + signal);
    await Promise.all([new Promise<void>((resolve) =>
        httpServer.close(() => {
            console.log('http server closed')
            resolve()
        })
    ), new Promise<void>((resolve) =>
        httpsServer.close(() => {
            console.log('https server closed')
            resolve()
        })
    ), proxyGatewayServer.closeAsync().then(() => console.log('proxy gateway closed'))])
    console.log('[local-dev-proxy] all server closed ');
    process.exit(128 + value);
}

Object.keys(signals).forEach(function (signal) {
    process.once(signal, function () {
        void shutdown(signal, signals[signal]);
    });
});