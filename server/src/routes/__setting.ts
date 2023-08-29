import {Request, Response} from "express";
import {RouteRuleRequest} from "../types";
import {storage} from "../storage";

const express = require('express');


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


const settingRouter = express.Router()


function addRules(req: RouteRuleRequest[]) {
    // 이미 로컬을 보고 있는게 있으면 엎어쓰지 않는다
    const filtered = req.filter(x =>
        !storage.getRules().some(y => y.key === x.key && /localhost|127\.0\.0\.1/.test(y.target))
    ).map(({
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
    }))

    storage.setRules(storage.getRules()
        .filter(x => !filtered.some(y => y.key === x.key || y.target === x.target))
        .concat(filtered).sort((a, b) => (a.priority || Number.MAX_VALUE) - (b.priority || Number.MAX_VALUE)))

    return filtered
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

    const added = addRules(data instanceof Array ? data : [data])

    console.log('[local-dev-proxy] registered \n' + JSON.stringify(added, null, 2));

    res.json({success: true});
});


settingRouter.post('/deregister', (req: Request, res: Response) => {

    if (!req.body || !(req.body instanceof Array)) {
        res.status(400).send('invalid input')
        return
    }
    const data: { key: string; target: string }[] = req.body
    storage.setRules(storage.getRules().filter(x => !data.some(y => y.key === x.key && y.target === x.target)))
    console.log('[local-dev-proxy] deregistered \n' + JSON.stringify(data, null, 2));

    res.json({success: true});
});

settingRouter.get('/rules', (req: Request, res: Response) => {
    res.json(storage.getRules().map(x => ({
        ...x,
        host: x.host?.toString(),
        path: x.path?.toString(),
        referrer: x.referrer?.toString()
    })));
});

export default settingRouter