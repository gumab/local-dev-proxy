export interface LocalDevProxyRule {
    key: string;
    priority?: number;
    path?: RegExp | string;
    host?: RegExp | string;
    pathRewrite?: { [key: string]: string };
}

export interface LocalDevProxySubRule extends LocalDevProxyRule {
    target: string;
}

export interface LocalDevProxyOption {
    rule: LocalDevProxyRule;
    subRules?: LocalDevProxySubRule[];
}

export function register(port: number, options: LocalDevProxyOption): void

