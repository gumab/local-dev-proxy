import {RouteRule} from "./types";
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
        fs.writeFileSync('storage.json', JSON.stringify(rules, null, 2))
    }

    getRules() {
        try {
            return JSON.parse(fs.readFileSync('storage.json').toString())
        } catch (e) {
            return []
        }
    }
}

export const storage: Storage = process.env.STORAGE === 'file' ? new FileStorage() : new DefaultStorage()