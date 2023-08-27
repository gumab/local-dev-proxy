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

const proxy = httpProxy.createProxyServer({
    secure: false,
    changeOrigin: true,
    target: {
        https: true,
    },
});

proxy.on('error', (err: Error, req: Request, res: Response) => {
    console.error(err)
    res.status(500).send('Error occurr' + err);
});

type RouteRule = {
    priority?: number
    path?: string | RegExp,
    host?: string | RegExp,
    pathRewrite?: { [key: string]: string }
    target: string,
}

type RouteRuleRequest = {
    priority?: number
    path?: string,
    pathRegex?: string,
    host?: string,
    hostRegex?: string,
    pathRewrite?: { [key: string]: string }
    target: string,
}

const ENV_FIX: { [key: string]: string } = {
    'development': '.dev',
    'stage': '.stg',
    'performance': '.perf',
    'production': ''
}


const getPhpUrl = (env: string) =>
    `https://www${ENV_FIX[env]}.kurly.com`
const getCampaignUrl = (env: string) =>
    `https://campaign${ENV_FIX[env].replace('.stg', '-stg')}.kurly.com`

const phpRouteRule: RouteRule = {
    priority: 3,
    host: 'www.local.kurly.com',
    target: getPhpUrl('development'),
}

const campaignRouteRule: RouteRule = {
    priority: 2,
    host: 'www.local.kurly.com',
    path: /^\/campaign/,
    pathRewrite: {
        '^/campaign': '',
    },
    target: getCampaignUrl('development'),
}

const routeRules: RouteRule[] = [phpRouteRule, campaignRouteRule];

const defaultServer = 'http://localhost:3000';

const settingRouter = express.Router()

settingRouter.post('/phpservers', (req: Request, res: Response) => {
    const env = req.body.env
    const host = req.body.host
    if (host || env) {
        if (host) {
            phpRouteRule.host = host
            campaignRouteRule.host = host
        }
        if (/production|performance|stage|development/.test(env)) {
            phpRouteRule.target = getPhpUrl(env)
            campaignRouteRule.target = getCampaignUrl(env)
        }
        res.json({success: true, data: [phpRouteRule, campaignRouteRule]});
        return
    }

    throw new Error('invalid host or env name (production|performance|stage|development)')
});

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
    const idx = routeRules.findIndex(x => x.target === req.target)
    if (idx >= 0) {
        routeRules.splice(idx, 1)
    }
    routeRules.push({
        ...req,
        host: getStringOrRegex(req.host, req.hostRegex),
        path: getStringOrRegex(req.path, req.pathRegex)
    })
}

const regExpToString = (input?: RegExp | string) => {
    if (input) {
        if (typeof input === 'string') {
            return input
        }
        return input.toString().replace(/^\/(.+)\/$/, '$1')
    }
}

function checkRequest(body: RouteRuleRequest[] | RouteRuleRequest): boolean {
    if (body instanceof Array) {
        return body.length > 0 && body.every(checkRequest)
    } else if (body) {
        return Boolean(body.path || body.host || body.pathRegex || body.hostRegex)
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
        host: regExpToString(x.host),
        path: regExpToString(x.path)
    })));
});

app.use('/__setting', settingRouter)

const makeProxyOption = (req: Request) => {
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
};

app.use((req: Request, res: Response) => {
    const option = makeProxyOption(req)
    try {
        proxy.web(req, res, option);
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