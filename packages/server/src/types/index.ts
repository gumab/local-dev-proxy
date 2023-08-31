export interface RouteRule {
    key: string
    priority?: number
    path?: string | RegExp,
    host: string,
    referrer?: RegExp,
    pathRewrite?: { [key: string]: string }
    target: string,
}

export interface SavedRouteRule extends Omit<RouteRule, 'path' | 'host' | 'referrer'> {
    path?: string,
    host?: string,
    referrer?: string,
}

export interface RouteRuleRequest {
    key: string
    priority?: number
    path?: string,
    pathRegex?: string,
    host: string,
    referrerRegex?: string,
    pathRewrite?: { [key: string]: string }
    target: string,
}