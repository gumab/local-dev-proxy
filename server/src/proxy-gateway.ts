import httpProxy from "http-proxy";
import http from "http";
import url from "url";
import net from 'net';
import {storage} from "./storage";

const regex_hostport = /^([^:]+)(:([0-9]+))?$/;

function getHostPortFromString(hostString: string, defaultPort: number) {
    let host = hostString;
    let port = defaultPort;

    const result = regex_hostport.exec(hostString);
    if (result) {
        host = result[1];
        if (result[2]) {
            port = Number(result[3]);
        }
    }

    return {host, port};
}

export class ProxyGateway {

    server: http.Server
    sockets = new Set<net.Socket>();

    constructor(httpPort: number, httpsPort: number) {
        const proxy = httpProxy.createProxyServer({});
        const server = http.createServer(function (req, res) {
            const {protocol, host, port} = url.parse(req.url || '');

            if (host === 'ldprx.com') {
                res.statusCode = 200
                res.write('local-dev-proxy is working')
                res.end()
                return
            }

            const isLocalTarget = storage.getRules().some(x => x.host === host)
            const targetHost = isLocalTarget ? '127.0.0.1' : host;
            const targetPort = isLocalTarget ? httpPort : port || 80;

            const target = protocol + "//" + targetHost + ':' + targetPort;

            proxy.on("error", function (err, req, res) {
                console.log("proxy error", err);
                res.end();
            });
            proxy.web(req, res, {target: target});
        })

        server.on('connection', (socket) => {
            this.sockets.add(socket);
            socket.once('close', () => {
                this.sockets.delete(socket);
            });
        });

        server.on('connect', async (req, clientSocket, bodyhead) => {
            const {host, port} = getHostPortFromString(req.url || '', 443);

            const isLocalTarget = storage.getRules().some(x => x.host === host) && port === 443

            const targetHost = isLocalTarget ? '127.0.0.1' : host || '';
            const targetPort = isLocalTarget ? httpsPort : port

            const serverSocket = net.connect(targetPort, targetHost, function () {
                    serverSocket.write(bodyhead);
                    clientSocket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
                }
            ).on('data', function (chunk) {
                clientSocket.write(chunk);
            }).on('end', function () {
                clientSocket.end();
            }).on('error', function () {
                clientSocket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
                clientSocket.end();
            });

            clientSocket.on('data', function (chunk) {
                serverSocket.write(chunk);
            }).on('end', function () {
                serverSocket.end();
            }).on('error', function () {
                serverSocket.end();
            });
        });
        this.server = server
    }

    listen(port: number, callback: () => void) {
        this.server.listen(port, callback)
        return this
    }

    async closeAsync() {
        await Promise.all(Array.from(this.sockets.values()).map(x => new Promise(resolve => {
            x.destroy()
            x.once('close', resolve)
        })))
        await new Promise(resolve => this.server.close(resolve))
    }
}
