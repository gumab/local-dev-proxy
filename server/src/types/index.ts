export type RouteRule = {
    key: string
    priority?: number
    path?: string | RegExp,
    host?: string | RegExp,
    referrer?: RegExp,
    pathRewrite?: { [key: string]: string }
    target: string,
}

export type RouteRuleRequest = {
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