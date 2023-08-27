export interface KurlyLocalProxyRule {
    priority?: number;
    path?: RegExp | string;
    host?: RegExp | string;
    pathRewrite?: { [key: string]: string }
}

export interface KurlyLocalProxySubRule extends KurlyLocalProxyRule {
    target: string,
}

export interface KurlyLocalProxyOption {
    rule: KurlyLocalProxyRule
    subRules?: KurlyLocalProxySubRule[]
}

export function register(port: number, options: KurlyLocalProxyOption): void

