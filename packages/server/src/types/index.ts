export interface RouteRule {
  key: string;
  priority?: number;
  path?: string | RegExp;
  host: string;
  referrer?: RegExp;
  pathRewrite?: { [key: string]: string };
  target: string;
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
