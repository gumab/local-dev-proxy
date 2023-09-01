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

export interface RouteRuleRequest {
  key: string;
  priority?: number;
  path?: string | null;
  pathRegex?: string | null;
  host: string;
  referrerRegex?: string | null;
  pathRewrite?: { [key: string]: string };
  target: string;
}
