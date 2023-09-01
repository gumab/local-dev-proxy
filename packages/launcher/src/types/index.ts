export interface LocalDevProxyRule {
  key: string;
  host: string;
  priority?: number;
  path?: RegExp | string;
  referrer?: RegExp;
  pathRewrite?: { [key: string]: string };
}

export interface LocalDevProxySubRule extends LocalDevProxyRule {
  target: string;
}

export interface LocalDevProxyOption {
  rule: LocalDevProxyRule | LocalDevProxyRule[];
  subRules?: LocalDevProxySubRule[];
}
