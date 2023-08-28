interface LocalDevProxyRule {
    key: string;
    priority?: number;
    path?: RegExp | string;
    host?: RegExp | string;
    referrer?: RegExp;
    pathRewrite?: { [key: string]: string };
}

interface LocalDevProxySubRule extends LocalDevProxyRule {
    target: string;
}

export interface LocalDevProxyOption {
    rule: LocalDevProxyRule | LocalDevProxyRule[];
    subRules?: LocalDevProxySubRule[];
}

export function register(port: number, options: LocalDevProxyOption): void

export function deregister(rules: { key: string; taget: string }[]): void

