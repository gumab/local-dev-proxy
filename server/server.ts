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
    res.status(500).send(err);
});

type RouteRule = {
    key: string
    priority?: number
    path?: string | RegExp,
    host?: string | RegExp,
    referrer?: RegExp,
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
    referrerRegex?: string,
    pathRewrite?: { [key: string]: string }
    target: string,
}

const storage: { routeRules: RouteRule[] } = {
    routeRules: []
}

const settingRouter = express.Router()

function getStringOrRegex(regexInput?: string): RegExp | undefined
function getStringOrRegex(regexInput?: string, strInput?: string): RegExp | string | undefined
function getStringOrRegex(regexInput?: string, strInput?: string) {
    if (regexInput) {
        try {
            const rgx = eval(regexInput)
            if (rgx instanceof RegExp) {
                return rgx
            }
        } catch (e) {
            // return nothing
        }
    } else if (strInput) {
        return strInput
    }
}

function addRules(req: RouteRuleRequest[]) {
    // 이미 로컬을 보고 있는게 있으면 엎어쓰지 않는다
    const filtered = req.filter(x =>
        !storage.routeRules.some(y => y.key === x.key && /localhost|127\.0\.0\.1/.test(y.target)))

    storage.routeRules = storage.routeRules
        .filter(x => !filtered.some(y => y.key === x.key || y.target === x.target))
        .concat(filtered.map(({
                                  host,
                                  hostRegex,
                                  path,
                                  pathRegex,
                                  referrerRegex,
                                  ...rest
                              }) => ({

            ...rest,
            host: getStringOrRegex(hostRegex, host),
            path: getStringOrRegex(pathRegex, path),
            referrer: getStringOrRegex(referrerRegex),
        }))).sort((a, b) => (a.priority || Number.MAX_VALUE) - (b.priority || Number.MAX_VALUE))
}

function checkRequest(body: RouteRuleRequest[] | RouteRuleRequest): boolean {
    if (body instanceof Array) {
        return body.length > 0 && body.every(checkRequest)
    } else if (body) {
        return Boolean(body.key && (body.path || body.host || body.pathRegex || body.hostRegex || body.referrerRegex))
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
        addRules(data)
    } else {
        addRules([data])
    }

    res.json({success: true});
});

settingRouter.post('/deregister', (req: Request, res: Response) => {

    if (!req.body || !(req.body instanceof Array)) {
        res.status(400).send('invalid input')
        return
    }
    const data: { key: string; target: string }[] = req.body
    storage.routeRules = storage.routeRules.filter(x => !data.some(y => y.key === x.key && y.target === x.target))

    res.json({success: true});
});

settingRouter.get('/rules', (req: Request, res: Response) => {
    res.json(storage.routeRules.map(x => ({
        ...x,
        host: x.host?.toString(),
        path: x.path?.toString(),
        referrer: x.referrer?.toString()
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
    const rule = storage.routeRules.find(({
                                              host,
                                              path, referrer
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
        if (referrer) {
            if (!referrer.test(req.headers['referer']?.toString() || '')) {
                return false;
            }
        }
        return true;
    });

    if (!rule) {
        throw new Error(`[local-dev-proxy] 매칭되는 서버가 없습니다. (${req.hostname}${req.path})`)
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
    try {
        const option = fixLocalHost(makeProxyOption(req))
        proxyServer.web(req, res, option);
    } catch (e) {
        if (e instanceof Error) {
            res.status(500).send(e.message)
        } else {
            throw e
        }
    }
});

const httpServer = app.listen(httpPort, () => {
    console.log('HTTP server listening on port ' + httpPort);
});

const httpsServer = https.createServer({
    key: fs.readFileSync('./keys/key.pem'),
    cert: fs.readFileSync('./keys/cert.pem'),
}, app).listen(httpsPort, () => {
    console.log('HTTPS server listening on port ' + httpsPort);
});