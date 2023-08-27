import {Request, Response} from "express";

const https = require('https');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');

const httpPort = Number(process.env.HTTP_PORT) || 80;
const httpsPort = Number(process.env.HTTPS_PORT) || 443;

const app = express();
app.use(bodyParser.json())

const proxyServer = httpProxy.createProxyServer({
    secure: false,
    changeOrigin: true,
    target: {
        https: true,
    },
});

proxyServer.on('error', (err: Error, req: Request, res: Response) => {
    res.status(500).send('Error occurr' + err);
});

type RouteRule = {
    key: string
    priority?: number
    path?: string | RegExp,
    host?: string | RegExp,
    pathRewrite?: { [key: string]: string }
    target: string,
}

type RouteRuleRequest = {
    key: string
    priority?: number
    path?: string,
    pathRegex?: string,
    host?: string,
    hostRegex?: string,
    pathRewrite?: { [key: string]: string }
    target: string,
}

const routeRules: RouteRule[] = [];

const defaultServer = 'http://localhost:3000';

const settingRouter = express.Router()

function getStringOrRegex(strInput?: string, regexInput?: string) {
    if (strInput) {
        return strInput
    } else if (regexInput) {
        try {
            const rgx = eval(regexInput)
            if (rgx instanceof RegExp) {
                return rgx
            }
        } catch (e) {
            // return nothing
        }
    }
}

function addRule(req: RouteRuleRequest) {
    let idx = -1
    do {
        idx = routeRules.findIndex(x => x.target === req.target || x.key === req.key)
        if (idx >= 0) {
            routeRules.splice(idx, 1)
        }
    } while (idx >= 0)
    const {host, hostRegex, path, pathRegex, ...rest} = req
    routeRules.push({
        ...rest,
        host: getStringOrRegex(host, hostRegex),
        path: getStringOrRegex(path, pathRegex),
    })
}

function checkRequest(body: RouteRuleRequest[] | RouteRuleRequest): boolean {
    if (body instanceof Array) {
        return body.length > 0 && body.every(checkRequest)
    } else if (body) {
        return Boolean(body.key && (body.path || body.host || body.pathRegex || body.hostRegex))
    }
    return false
}

settingRouter.post('/register', (req: Request, res: Response) => {
    const data: RouteRuleRequest[] | RouteRuleRequest = req.body
    if (!checkRequest(data)) {
        res.status(400).send('invalid input')
        return
    }
    if (data instanceof Array) {
        data.forEach(addRule)
    } else {
        addRule(data)
    }

    res.json({success: true});
});

settingRouter.get('/rules', (req: Request, res: Response) => {
    res.json(routeRules.map(x => ({
        ...x,
        host: x.host?.toString(),
        path: x.path?.toString()
    })));
});

app.use('/__setting', settingRouter)

function fixLocalHost<T extends { target: string }>(input: T) {
    const localhostIp = process.env.LOCALHOST || '127.0.0.1'

    return {
        ...input,
        target: input.target.replace(/(https?:\/\/)(?:localhost|127\.0\.0\.1)/, '$1' + localhostIp)
    }
}

function makeProxyOption(req: Request): { target: string, ignorePath?: boolean } {
    const sorted = routeRules.sort((a, b) => (a.priority || Number.MAX_VALUE) - (b.priority || Number.MAX_VALUE))
    const rule = sorted.find(({
                                  host,
                                  path
                              }) => {
        if (host) {
            if (typeof host === "string") {
                if (host !== req.hostname) {
                    return false;
                }
            } else {
                if (!host.test(req.hostname)) {
                    return false;
                }
            }
        }
        if (path) {
            if (typeof path === 'string') {
                if (path !== req.path) {
                    return false;
                }
            } else {
                if (!path.test(req.path)) {
                    return false;
                }
            }
        }
        return true;
    });

    if (!rule) {
        return {
            target: defaultServer
        }
    }
    if (rule.pathRewrite) {
        const rewrittenPath = Object.entries(rule.pathRewrite).reduce((path, [pattern, value]) => {
            return path.replace(new RegExp(pattern), value)
        }, req.path)

        return {
            target: rule.target + rewrittenPath,
            ignorePath: true,
        };
    }
    return {
        target: rule.target,
    };
}

app.use((req: Request, res: Response) => {
    const option = fixLocalHost(makeProxyOption(req))
    try {
        proxyServer.web(req, res, option);
    } catch (e) {
    }
});

app.listen(httpPort, () => {
    console.log('HTTP server listening on port ' + httpPort);
});

https.createServer({
    key: fs.readFileSync('./keys/key.pem'),
    cert: fs.readFileSync('./keys/cert.pem'),
}, app).listen(httpsPort, () => {
    console.log('HTTPS server listening on port ' + httpsPort);
});