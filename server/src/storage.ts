import {RouteRule, SavedRouteRule} from "./types";
import fs from "fs";

console.log(process.env.STORAGE)

interface Storage {
    setRules(rules: RouteRule[]): void

    getRules(): RouteRule[]
}

class DefaultStorage implements Storage {
    private rules: RouteRule[]

    constructor() {
        this.rules = []
    }

    setRules(rules: RouteRule[]) {
        this.rules = rules
    }

    getRules() {
        return this.rules
    }
}


class FileStorage implements Storage {
    setRules(rules: RouteRule[]) {
        fs.writeFileSync('storage.json', JSON.stringify(rules.map<SavedRouteRule>(x => ({
            ...x,
            path: x.path?.toString(),
            host: x.host?.toString(),
            referrer: x.referrer?.toString()
        })), null, 2))
    }

    getRules(): RouteRule[] {
        try {
            return (JSON.parse(fs.readFileSync('storage.json').toString()) as SavedRouteRule[]).map<RouteRule>(x => ({
                ...x,
                path: x.path && /^\/.+\/$/.test(x.path) ? eval(x.path) : x.path,
                host: x.host && /^\/.+\/$/.test(x.host) ? eval(x.host) : x.host,
                referrer: x.referrer && /^\/.+\/$/.test(x.referrer) ? eval(x.referrer) : x.referrer,
            }))
        } catch (e) {
            return []
        }
    }
}

export const storage: Storage = process.env.STORAGE === 'file' ? new FileStorage() : new DefaultStorage()