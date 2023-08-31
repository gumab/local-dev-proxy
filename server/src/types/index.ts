export interface RouteRule {
    key: string
    priority?: number
    path?: string | RegExp,
    host?: string | RegExp,
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
    host?: string,
    hostRegex?: string,
    referrerRegex?: string,
    pathRewrite?: { [key: string]: string }
    target: string,
}